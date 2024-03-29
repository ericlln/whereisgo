# Whereisgo
Provides an overview of the ongoing trips in the GO Transit system with data available from the [GO Transit OpenAPI](http://api.openmetrolinx.com/OpenDataAPI/Help).

## Description
This project was intended to explore the various forms of data provided by the [GO Transit OpenAPI](http://api.openmetrolinx.com/OpenDataAPI/Help), and the insights that could potentially be extracted from them.

Although the application's scope is currently limited to location of vehicles at a given time,  it can serve as a framework for further analysis on the transit system using such publicly available data.

The application consists of a data server that periodically calls the aforementioned API and processes it into the database and a gRPC server that handles requests from the React client.

A demo of the application running can be found [here](https://cdn.erii.cc/whereisgodemo.gif).

## Build Instructions

Generate the required gRPC code by running the `generate_proto.sh` script, which requires Node.js, the [protoc compiler](https://github.com/protocolbuffers/protobuf/releases), as well as the plugins [protoc-gen-go](https://pkg.go.dev/google.golang.org/protobuf@v1.28.0/cmd/protoc-gen-go) and [protoc-gen-go-grpc](https://pkg.go.dev/google.golang.org/grpc/cmd/protoc-gen-go-grpc). This process is to be done through Docker in the future.


In a `.env` file in the root directory, include the following variables:

`DATABASE_URL="{Postgres connection string}"`

`REDIS_URL="{Redis connection string}"`

`TRANSIT_API_KEY={GO Transit API Key}`

Note: This API key can be acquired for free from the [GO API Registration](http://api.openmetrolinx.com/OpenDataAPI/) page.

Run `docker compose up` from the root directory.


