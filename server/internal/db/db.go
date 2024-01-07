package db

import (
	"github.com/redis/go-redis/v9"
	"log"
	"sync"
)

type Redis struct {
	Client *redis.Client
}

var (
	redisInstance *Redis
	redisOnce     sync.Once
)

func NewRedis(connString string) (*Redis, error) {
	redisOnce.Do(func() {
		opt, err := redis.ParseURL(connString)
		if err != nil {
			log.Fatalln("Error parsing Redis connection URL")
		}

		client := redis.NewClient(opt)

		redisInstance = &Redis{client}
	})

	return redisInstance, nil
}

func CloseRedis(redis *Redis) {
	_ = redis.Client.Close()
}
