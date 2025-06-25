# go-geo-tree-table
[![Go-Test](https://github.com/lao-tseu-is-alive/go-geo-tree-table/actions/workflows/go.yml/badge.svg)](https://github.com/lao-tseu-is-alive/go-geo-tree-table/actions/workflows/go.yml)

Using the Go programming language to develop a backend API and a frontend interface for creating, managing, and importing tree location data in Lausanne, Switzerland

### Latest Docker Container Image
you can find all the versions of this 
[Docker Container Image and instructions to pull the images from the Packages section on the right part of this page](https://github.com/lao-tseu-is-alive/go-geo-tree-table/pkgs/container/go-geo-tree-table)



### OpenApi:
We ensure the OpenAPI contract based approach is fulfilled 
by generating the Go server routes directly from the Yaml 
specification using 
[deepmap/oapi-codegen](https://github.com/deepmap/oapi-codegen)

The OpenApi 3.0 definition is available in 
[Yaml](https://raw.githubusercontent.com/lao-tseu-is-alive/go-geo-tree-table/refs/heads/main/api/geoTree.yaml) 
and [JSON](https://raw.githubusercontent.com/lao-tseu-is-alive/go-geo-tree-table/refs/heads/main/api/geoTree.json) 
format in the api directory. 
The nice and interactive [Swagger documentation](https://lao-tseu-is-alive.github.io/go-geo-tree-table/) is available at this url  https://lao-tseu-is-alive.github.io/go-geo-tree-table/


### Dependencies
[Echo: high performance, extensible, minimalist Go web framework](https://echo.labstack.com/)

[deepmap/oapi-codegen: OpenAPI Client and Server Code Generator](https://github.com/deepmap/oapi-codegen)

[pgx: PostgreSQL Driver and Toolkit](https://pkg.go.dev/github.com/jackc/pgx)

[Json Web Token for Go (RFC 7519)](https://github.com/cristalhq/jwt)


### Project Layout and conventions
This project uses the Standard Go Project Layout : https://github.com/golang-standards/project-layout
