package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/ericlln/whereisgo/internal/config"
	"github.com/ericlln/whereisgo/pkg/db"
	"github.com/ericlln/whereisgo/proto"
	"github.com/redis/go-redis/v9"
	"google.golang.org/grpc"
	"log"
	"math"
	"net"
	"strconv"
	"time"
)

var red = getRedis()

func getRedis() *db.Redis {
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

	listener, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Printf("Error creating listener: %s \n", err)
	}

	locator.RegisterLocatorServer(server, service)
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
