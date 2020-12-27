/* eslint-disable @typescript-eslint/no-var-requires */
import * as program from "commander";
import { generateAPIClient } from "./lib";
import { convertEnums } from "./lib/convertEnums";

const version = require("../package.json").version;
program.version(version);
program.option("-v, --version", "Output current version");

program
    .command("gen-agent <source> [destination]")
    .description("Generate API Agent")
    .action((source, destination) => {
        generateAPIClient(source, destination);
    });

program
    .command("convert-enums <sourceDir> <destinationDir>")
    .description("clone a repository into a newly created directory")
    .action((sourceDir, destinationDir) => {
        convertEnums(sourceDir, destinationDir);
    });

program.parse(process.argv);
