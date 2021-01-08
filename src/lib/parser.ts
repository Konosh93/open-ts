import * as SwaggerParser from "@apidevtools/swagger-parser";
import { OpenAPIV3 } from "openapi-types";
import * as path from "path";
import * as logs from "../utils/logs";

export async function getValidSchema(
    relPath: string
): Promise<OpenAPIV3.Document> {
    try {
        await SwaggerParser.validate(path.resolve(process.cwd(), relPath));
        const result: any = await SwaggerParser.bundle(
            path.resolve(process.cwd(), relPath),
            { parse: { json: true } }
        );
        return result;
    } catch (error) {
        logs.error("Validation Error");
        logs.log(error.message);
        process.exit(1);
    }
}
