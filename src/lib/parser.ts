import * as SwaggerParser from "@apidevtools/swagger-parser";
import { OpenAPIV3 } from "openapi-types";
import * as path from "path";

export async function getValidSchema(
    relPath: string
): Promise<OpenAPIV3.Document> {
    await SwaggerParser.validate(path.resolve(process.cwd(), relPath));
    const result: any = await SwaggerParser.bundle(
        path.resolve(process.cwd(), relPath),
        { parse: { json: true } }
    );
    return result;
}
