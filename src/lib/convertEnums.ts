import * as fs from "fs-extra";
import * as path from "path";
import * as ts from "typescript";
import * as _ from "lodash";
import * as yaml from "js-yaml";

async function getFilesRecursively(startPath: string, res: string[]) {
    if (!(await fs.pathExists(startPath))) {
        return;
    }

    const files = await fs.readdir(startPath);
    await Promise.all(
        files.map(async file => {
            const filename = path.join(startPath, file);
            const stat = await fs.lstat(filename);
            if (stat.isDirectory()) {
                await getFilesRecursively(filename, res);
            } else if (filename.slice(-3) === ".ts") {
                res.push(filename);
            }
        })
    );
}

interface EnumFile {
    name: string;
    type: string;
    items: (string | number)[];
}

export async function convertEnums(
    srcDir: string,
    destFile: string
): Promise<void> {
    const srcDirPath = path.resolve(process.cwd(), srcDir);
    const files = [];
    await getFilesRecursively(srcDirPath, files);
    const output: EnumFile[] = [];
    const enumNames: { [name: string]: true } = {};

    function getEnumName(name: string) {
        let i = 0;
        let tempName = name;
        while (enumNames[tempName]) {
            i++;
            tempName = name + i;
        }
        return tempName;
    }
    files.forEach(tsFile => {
        const program = ts.createProgram([tsFile], {});
        const source = program.getSourceFile(tsFile);
        const checker = program.getTypeChecker();

        function traverseNode(node: ts.Node) {
            if (node.kind === ts.SyntaxKind.EnumDeclaration) {
                const enumNode = node as ts.EnumDeclaration;
                const supportedType = getSupportedType(enumNode);
                if (!supportedType) {
                    return;
                }
                const enumName = getEnumName(enumNode.name.getText());
                const values: (string | number)[] = [];
                enumNode.members.forEach(enumMember => {
                    const value = checker.getConstantValue(enumMember);
                    values.push(value);
                });
                output.push({
                    name: enumName,
                    type: supportedType,
                    items: values
                });
            }
            ts.forEachChild(node, traverseNode);
        }

        function getSupportedType(enumNode: ts.EnumDeclaration) {
            const enumTye = typeof checker.getConstantValue(
                enumNode.members[0]
            );
            if (enumTye !== "string" && enumTye !== "number") {
                console.warn("Unsupported enum file detected: ", tsFile);
                return null;
            }
            enumNode.members.forEach(item => {
                const value = checker.getConstantValue(item);
                if (typeof value !== enumTye) {
                    console.warn(
                        "Heterogenous enums are not supported: ",
                        tsFile
                    );
                    return null;
                }
            });
            return enumTye;
        }

        traverseNode(source);
    });

    generateYamlFile(destFile, output);
}

async function generateYamlFile(outputFile: string, files: EnumFile[]) {
    const schemas = {};
    files.forEach(f => {
        schemas[f.name] = { type: f.type, enum: f.items };
    });
    const yamlData = yaml.safeDump({ components: { schemas } });
    await fs.writeFile(outputFile, yamlData);
}
