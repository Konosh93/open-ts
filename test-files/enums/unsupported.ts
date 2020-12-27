enum HeterogeneousEnum {
    One = 1,
    Bar = "bar"
}

enum Computed {
    Foo = getMyValue(),
    Bar = 2
}

function getMyValue() {
    return 1;
}