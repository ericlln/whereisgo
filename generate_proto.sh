#!/bin/bash

# Generate TS code
for filename in ./proto/*.proto; do
    [ -e "$filename" ] || continue
    cp "$filename" ./client
done

cd ./client
mkdir -p ./src/proto
npx protoc --ts_out ./src/proto --ts_opt long_type_string --proto_path . ./locator.proto

# Generate GO code
cd ..
protoc --go_out=server --go_opt=paths=source_relative --go-grpc_out=server --go-grpc_opt=paths=source_relative proto/locator.proto
