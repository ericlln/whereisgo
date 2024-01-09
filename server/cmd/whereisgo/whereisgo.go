package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/ericlln/whereisgo/server/internal/config"
	"github.com/ericlln/whereisgo/server/pkg/db"
	"github.com/ericlln/whereisgo/server/proto"
	"github.com/redis/go-redis/v9"
	"google.golang.org/grpc"
	"log"
	"math"
	"net"
	"strconv"
	"time"
)

var red = initRedis()
var pg = initPg()

func initPg() *db.Postgres {
	cfg := config.GetConfig()
	newPg, err := db.NewPG(context.Background(), cfg.DatabaseUrl)
	if err != nil {
		return nil
	}
	return newPg
}

func initRedis() *db.Redis {
	cfg := config.GetConfig()
	r, err := db.NewRedis(cfg.RedisUrl)
	if err != nil {
		log.Fatal("Error creating Redis connection")
	}
	return r
}

func main() {
	server := grpc.NewServer()
	service := &locateServer{}
	service2 := &tripDetailsServer{}

	listener, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Printf("Error creating listener: %s \n", err)
	}

	locator.RegisterLocatorServer(server, service)
	locator.RegisterTripDetailsServer(server, service2)
	err = server.Serve(listener)
	if err != nil {
		log.Printf("Error serving listener: %s \n", err)
	}
}

func Distance(lat1, lng1, lat2, lng2 float64) float64 {
	r := 6371e3 // meters
	phi1 := lat1 * math.Pi / 180
	phi2 := lat2 * math.Pi / 180
	dPhi := (lat2 - lat1) * math.Pi / 180
	dLam := (lng2 - lng1) * math.Pi / 180

	a := math.Sin(dPhi/2)*math.Sin(dPhi/2) + math.Cos(phi1)*math.Cos(phi2)*math.Sin(dLam/2)*math.Sin(dLam/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return r * c
}

type Position struct {
	Lat       float64
	Lng       float64
	Course    int32
	Timestamp int64
}

type locateServer struct {
	locator.UnimplementedLocatorServer
}

// Locate
func (ls locateServer) Locate(ctx context.Context, req *locator.LocateRequest) (*locator.LocateMessage, error) {
	l := req.GetL()
	b := req.GetB()
	cLat := req.GetCLat()
	cLng := req.GetCLng()
	r := cLng + math.Abs(cLng-l)
	t := cLat + math.Abs(cLat-b)

	width := Distance(cLat, l, cLat, r)  // horizontal distance => constant lat
	height := Distance(t, cLng, b, cLng) // vertical distance => constant lng

	query := &redis.GeoSearchQuery{
		Latitude:  cLat,
		Longitude: cLng,
		BoxWidth:  width,
		BoxHeight: height,
		BoxUnit:   "m",
	}

	values, err := red.Client.GeoSearch(ctx, "locates", query).Result()
	if err != nil {
		log.Printf("Failed to GeoSearch: %s \n", err)
	}

	log.Println(len(values), "vehicles found")
	if len(values) == 0 {
		return nil, nil
	}

	var locates []*locator.Locate

	cmds, err := red.Client.Pipelined(ctx, func(pipe redis.Pipeliner) error {
		for _, tripId := range values {
			pipe.Get(ctx, tripId)
		}
		return nil
	})
	if err != nil {
		log.Printf("")
	}

	for _, cmd := range cmds {
		var position Position

		err = json.Unmarshal([]byte(cmd.(*redis.StringCmd).Val()), &position)
		if err != nil {
			log.Println("Error parsing response")
			continue
		}

		tripId := fmt.Sprintf("%v", cmd.Args()[1]) // args: [get, key]
		id, err := strconv.Atoi(tripId)
		if err != nil {
			log.Printf("Error parsing trip ID of %s: %v \n", tripId, err)
		}

		loc := locator.Locate{
			TripId: int32(id),
			Lat:    position.Lat,
			Lng:    position.Lng,
			Course: position.Course,
		}

		locates = append(locates, &loc)
	}

	return &locator.LocateMessage{
		Locates:   locates,
		Timestamp: time.Now().Unix(),
	}, nil
}

type tripDetailsServer struct {
	locator.UnimplementedTripDetailsServer
}

func fetchStops() {

}

func (ts tripDetailsServer) TripDetails(ctx context.Context, req *locator.TripDetailsRequest) (*locator.TripDetailsMessage, error) {
	row := pg.Db.QueryRow(context.Background(), "SELECT route_number, bus_type, first_stop, prev_stop, last_stop, delay, start_time, end_time FROM public.trips WHERE trip_id = $1", req.TripId)

	var routeNumber string
	var busType int32
	var firstStop int32
	var prevStop int32
	var lastStop int32
	var delay int32
	var startTime string
	var endTime string

	err := row.Scan(&routeNumber, &busType, &firstStop, &prevStop, &lastStop, &delay, &startTime, &endTime)
	if err != nil {
		return nil, err
	}

	return &locator.TripDetailsMessage{
		RouteNumber: routeNumber,
		StartTime:   startTime,
		EndTime:     endTime,
		BusType:     0,
		Stops: &locator.Stops{
			FirstStop: "1",
			PrevStop:  "2",
			LastStop:  "3",
		},
		DelayInSeconds: delay,
		Timestamp:      time.Now().Unix(),
	}, nil
}
