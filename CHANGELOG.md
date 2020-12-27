## 1.0.0 (December 10, 2020)
### Add sub-commands:
```
  gen-agent <sourceFile> <destinationFile>    Generate API Agent
  convert-enums <sourceDir> <destinationDir>  Generate OpenAPI enums from Typescript enums
```

### OpenAPI enums generator
- Generate openAPI enums as yaml file from all enums found in TS files within a specified directory.

## 0.0.11 (December 10, 2020)
- Fix bug in caused by wrong null check.
When `minimum` or `maximum` is set to 0, `Min` and `Max` validators are not created.
```ts
        pickupHour:
          type: integer
          minimum: 0
          maximum: 0
```

before: 

```ts
    @IsOptional()
    @IsInt()
    pickupHour: number;
```
After:

```ts
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(0)
    pickupHour: number;
```

## 0.0.10 (December 09, 2020)
- Fix bug in caused by wrong import from `class-validator`.
    - IsMin => Min
    - IsMax => Max
