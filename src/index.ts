/* eslint-disable @typescript-eslint/no-var-requires */
import * as program from "commander";
import { generateAPIClient } from "./lib";

const version = require("../package.json").version;
program.version(version);
program.option("-v, --version", "Output current version");

program.parse(process.argv);

generateAPIClient(process.argv[2], process.argv[3]);
