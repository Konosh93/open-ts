## 1.3.4 (Dec 21, 2022)
### Target Command: all
- Lock typescript version to `~4.7.4` as `~4.9.4` seems to have breaking changes.

## 1.3.3 (July 22, 2022)
### Target Command: all
- Fix bug introduced in previous version

## 1.3.2 (July 22, 2022)
### Target Command: all
- Bump Typescript version

## 1.3.1 (October 19, 2021)
### Target Command: `gen-agent`
- `$ref` is not validated correctly when it has `nullable: true`

## 1.3.0 (September 6, 2021)
### Target Command: `convert-enums`
- Add generation of openAPI enums as yaml file from all object literals annotated by `const` keyword in a given directory.

#### Input
```ts
const ObjectEnumStr = {
    Foo: "FOO",
    Bar: "BAR"
} as const;

const ObjectEnumNum = {
    One: 1,
    Bar: 2
} as const;

const ObjectEnumWithFunc = {
    func: () => 1
} as const;

const ObjectEnumWithBool = {
    bool: true
} as const;

const MixedObjectEnum = {
    Foo: "FOO",
    One: 1
} as const;

const ObjectEnumEmpty = {} as const;

/* open-ts: ignore-convert-enums */
const ObjectEnumIgnored = {
    Baz: "BAZ",
    Qux: "QUX"
} as const;

const ObjectEnumMutable = {
    Quux: "QUUX",
    quuz: "QUUZ"
};
```

#### Output
```yaml
ObjectEnumNum:
  type: number
  enum:
    - 1
    - 2
ObjectEnumStr:
  type: string
  enum:
    - FOO
    - BAR
```

## 1.2.0 (June 17, 2021)
### Target Command: `gen-agent`

Implemented OpenAPI enum definitions to be generated as TypeScript UnionTypes instead of TypeScript Enums.

#### Input(`api.yaml`)
```yaml
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
PetExternalEnum:
  $ref: './schemas/fileJoin.yml#/ExternalEnum'
（-- Abbreviation --）
petNumberType:
  $ref: '#/components/schemas/NumberEnum'
petStringType:
  $ref: '#/components/schemas/StringEnum'
petExternalEnum:
  $ref: '#/components/schemas/PetExternalEnum'
petListEnum:
  type: array
  items:
    $ref: '#/components/schemas/StringEnum'
petDirectEnum:
  type: string
  enum:
    - x
    - y
    - z
```

#### Output(`generated.ts`)
```ts
export type NumberEnum = typeof NumberEnum[keyof typeof NumberEnum];
export type StringEnum = typeof StringEnum[keyof typeof StringEnum];
export type PetExternalEnum = typeof PetExternalEnum[keyof typeof PetExternalEnum];
export const NumberEnum = {
    1: 1,
    2: 2
} as const;
export const StringEnum = {
    a: "a",
    b: "b"
} as const;
export const PetExternalEnum = {
    1: 1,
    2: 2
} as const;
export class AddPetRequestBodyValidator {
    /**
     * petNumberType
     */
    @IsOptional()
    @IsIn(Object.values(NumberEnum))
    petNumberType: NumberEnum;
    /**
     * petStringType
     */
    @IsOptional()
    @IsIn(Object.values(StringEnum))
    petStringType: StringEnum;
    /**
     * petExternalEnum
     */
    @IsOptional()
    @IsIn(Object.values(PetExternalEnum))
    petExternalEnum: PetExternalEnum;
    /**
     * petListEnum
     */
    @IsOptional()
    @IsArray()
    @IsIn(Object.values(StringEnum), { each: true })
    petListEnum: StringEnum[];
    /**
     * petDirectEnum
     */
    @IsOptional()
    @IsIn(["x","y","z"])
    petDirectEnum: "x" | "y" | "z";
}
```

## 1.1.1 (February 27, 2021)
### Target Command: `gen-agent`
- Fix nested array check

```yaml
  petDataList:
    type: array
    items:
      $ref: '#/components/schemas/NewPet'
```

#### Before
```ts
    /**
     * petDataList
     */
    @IsOptional()
    @IsArray()
    @IsEnum(undefined, { each: true })
    petDataList: NewPet[];
```


#### After
```ts
    /**
     * petDataList
     */
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => NewPetValidator)
    petDataList: NewPet[];
```

## 1.1.0 (January 17, 2021)
### Target Command: `gen-agent`
- Allow nested object validation.

```yaml
  petData:
    $ref: '#/components/schemas/NewPet'
  inlineObject:
    type: object
    properties:
      food:
        type: string
```

```ts
    /**
     * petData
     */
    @IsOptional()
    @ValidateNested()
    @Type(() => NewPetValidator)
    petData: NewPet;
    /**
     * inlineObject
     */
    @IsOptional()
    @ValidateNested()
    @Type(() => InlineObject2Validator)
    inlineObject: {
        food?: string;
    };

export class NewPetValidator {
  ...
}
export class InlineObject2Validator {
  ...
}
```

## 1.0.5 (January 8, 2021)
### Target Command: `gen-agent`
- Throw and error and exit process with schema validation error is encountered.
- Show warning when missing required properties are found.

```
Validation Error
Error parsing ~/open-ts/test-files/pet.yaml 
duplicated mapping key at line 248, column -764:
          properties:
          ^
```

## 1.0.4 (January 6, 2021)
- Allow validating required nullable parameters by adding conditional validation using `ValidateIf`.
  - Target Command: `gen-agent`

```yml
    Customer:
      type: object
      required:
        - name  
      properties:
        name:
          type: string
          nullable: true
        birthday:
          type: string
          format: date
          nullable: true
```

```ts
    /**
     * name
     */
    @IsNotEmpty()
    @ValidateIf(o => o.name !== null)
    name: string;
    /**
     * birthday
     */
    @IsOptional()
    @Type(() => Date)
    birthday: Date;
```

## 1.0.3 (January 3, 2021)
### Target Command: `gen-agent`
- Throw and error and exit process with schema validation error is encountered.
- Show warning when missing required properties are found.

```
Validation Error
Error parsing ~/open-ts/test-files/pet.yaml 
duplicated mapping key at line 248, column -764:
          properties:
          ^
```

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
