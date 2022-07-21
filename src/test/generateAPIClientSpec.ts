import ava from "ava";
import { generateAPIClient } from "../lib";
import * as path from "path";
import * as fs from "fs-extra";

const SRC_FILE = path.resolve(process.cwd(), "test-files/pet.yaml");
const OUTPUT_FILE = path.resolve(
    process.cwd(),
    "test-files/temp/file-for-test-only.ts"
);
const TEMP_DIR = path.resolve(process.cwd(), "test-files/temp/");
const EXPECTED_FILE = path.resolve(
    process.cwd(),
    "test-files/expected-file.ts"
);

const test = ava;
test.before(async () => {
    try {
        await fs.mkdir(TEMP_DIR);
    } catch (error) {
        // no op
    }
});
test.beforeEach(async () => {
    try {
        await fs.unlink(OUTPUT_FILE);
    } catch (error) {
        // no op
    }
});

test.serial("Should convert data successfully", async t => {
    await generateAPIClient(SRC_FILE, OUTPUT_FILE);
    const expected = await fs.readFile(EXPECTED_FILE, "utf-8");
    const result = await fs.readFile(OUTPUT_FILE, "utf-8");
    t.is(expected, result, "Should be the same");
});
