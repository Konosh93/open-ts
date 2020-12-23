import * as fs from "fs";
import * as path from "path";
import { getValidSchema } from "./parser";
import { generate } from "./generateAPIClient";

export async function generateAPIClient(relPath: string, output: string) {
    const schema = await getValidSchema(relPath);
    const result = generate(schema);
    fs.writeFile(path.resolve(process.cwd(), output), result, err => {
        if (err) throw err;
    });
}
