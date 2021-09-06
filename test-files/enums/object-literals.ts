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
