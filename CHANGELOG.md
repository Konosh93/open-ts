## 1.0.3 (January 3, 2021)
- Allow class validator to validate array of enums.
  - Target Command: `gen-agent`

```yml
  petListEnum:
    type: array
    items:
      $ref: '#/components/schemas/StringEnum'
```

```ts
    /**
     * petListEnum
     */
    @IsOptional()
    @IsArray()
    @IsEnum(StringEnumEnum, { each: true })
    petListEnum: StringEnum[];
```

## 1.0.2 (December 30, 2020)
- Allow generating Typescript enums for validation.
  - Target Command: `gen-agent`

```yml
    NumberEnum:
      type: number
      enum:
        - 1
        - 2
    StringEnum:
      type: string
      enum:
        - a
        - b
```

```ts
enum NumberEnumEnum {
    _1 = 1,
    _2 = 2
}
enum StringEnumEnum {
    _a = "a",
    _b = "b"
}
```

### Validation

```ts
    /**
     * petNumberType
     */
    @IsOptional()
    @IsEnum(NumberEnumEnum)
    petNumberType: NumberEnum;
```

## 1.0.1 (December 29, 2020)
- Fix bug when number enums are found in the specs file.
  - Target Command: `gen-agent`

```yml
    NumberEnum:
      type: number
      enum:
        - 1
        - 2
    StringEnum:
      type: string
      enum:
        - a
        - b
```

```ts
export type NumberEnum = 1 | 2;
export type StringEnum = "a" | "b";
```

## 1.0.0 (December 27, 2020)
### Add sub-commands:
```
  gen-agent <sourceFile> <destinationFile>    Generate API Agent
  convert-enums <sourceDir> <destinationDir>  Generate OpenAPI enums from Typescript enums
```

### OpenAPI enums generator
- Generate openAPI enums as yaml file from all enums found in TS files within a specified directory.

### Multi-file support
- Allow using refs to external files.

## 0.0.11 (December 10, 2020)
- Fix bug caused by wrong null check.
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
