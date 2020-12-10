## 0.0.10 (December 09, 2020)
- Fix bug in caused by wrong import from `class-validator`.
    - IsMin => Min
    - IsMax => Max

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