enum WithDefault {
    Num0,
    Num1,
    Num2
}

enum WithStarter {
    Num1 = 1,
    Num2,
    Num3
}

enum Texts {
    Foo = "foo",
    Bar = "bar"
}

enum Numbers {
    One = 1,
    Two = 2
}

enum SpecialString { // https://github.com/nodeca/js-yaml/issues/320
    Seven = "07",
    Eight = "08",
    Nine = "09",
    Ten = "10",
    Quoted = "01234",
    Unquoted = "01238"
}

export enum Exported {
    Foo = "foo"
}
