import * as ava from "ava";
import { generateAPIClient } from "../lib";
import * as path from "path";
import * as fs from "fs-extra";
import * as rimraf from "rimraf";

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

test.beforeEach(async () => {
    await new Promise((resolve, reject) => rimraf(TEMP_DIR, resolve));
    await fs.mkdir(TEMP_DIR);
});

test.serial("Should convert data successfully", async t => {
    await generateAPIClient(SRC_FILE, OUTPUT_FILE);
    const expected = await fs.readFile(EXPECTED_FILE, "utf-8");
    const result = await fs.readFile(OUTPUT_FILE, "utf-8");
    t.is(expected, result, "Should be the same");
});
