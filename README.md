# OpenAPI Typescript Generator
This library allows generating code for Typescript and OpenAPI specs. The main feature of this library is the generation of API Clients in Typescript from OpenAPI specs. One of the other features this library supports is generating [OpenAPI enums!](https://swagger.io/docs/specification/data-models/enums/) from Typescript code.

## Installation
```
npm install -g open-ts
```

## Usage
1/ API Agent
```
open-ts gen-agent <path/to/your-openapi-specs-file.yml> <path/to/generated/your-ts-file.ts>
```

2/ OpenAPI enums
```
open-ts convert-enums <path/to/dir> <path/to/generated/your-yaml-file.yml>
```
