import * as ava from "ava";
import * as path from "path";
import * as fs from "fs-extra";
import { convertEnums } from "../lib/convertEnums";
import * as sinon from "sinon";
import * as logs from "../utils/logs";

const sandbox = sinon.createSandbox();

const SRC_DIR = path.resolve(process.cwd(), "test-files/enums");

const OUTPUT_FILE = path.resolve(
    process.cwd(),
    "test-files/temp/generated-enum.yml"
);
const TEMP_DIR = path.resolve(process.cwd(), "test-files/temp/");
const EXPECTED_FILE = path.resolve(
    process.cwd(),
    "test-files/expected-enum-file.yml"
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
    await fs.unlink(OUTPUT_FILE);
    sandbox.stub(logs, "warn");
});

test.afterEach(() => {
    sandbox.restore();
});

test.serial("Should convert enums correctly", async t => {
    await convertEnums(SRC_DIR, OUTPUT_FILE);
    const expected = await fs.readFile(EXPECTED_FILE, "utf-8");
    const result = await fs.readFile(OUTPUT_FILE, "utf-8");
    t.is(expected, result, "Should be the same");
});
