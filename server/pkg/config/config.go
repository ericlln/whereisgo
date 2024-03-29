package config

import (
	"github.com/joho/godotenv"
	"log"
	"os"
	"regexp"
)

func loadEnv(projectDirName string) {
	projectName := regexp.MustCompile(`^(.*` + projectDirName + `)`)
	currentWorkDirectory, _ := os.Getwd()
	rootPath := projectName.Find([]byte(currentWorkDirectory))

	err := godotenv.Load(string(rootPath) + `/.env`)

	if err != nil {
		log.Println("Error loading .env file:", err)
	}
}

type Config struct {
	DatabaseUrl   string
	RedisUrl      string
	TransitApiKey string
}

func GetConfig(projectDirName string) *Config {
	loadEnv(projectDirName)

	return &Config{
		DatabaseUrl:   os.Getenv("DATABASE_URL"),
		RedisUrl:      os.Getenv("REDIS_URL"),
		TransitApiKey: os.Getenv("TRANSIT_API_KEY"),
	}
}
