import * as ts from "typescript";
import { OpenAPIV3 } from "openapi-types";
import generateAPICode from "./helpers";

export function generate(doc: OpenAPIV3.Document) {
    const sourceFile = generateAPICode(doc);
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const result = printer.printFile(sourceFile);
    return result;
}
