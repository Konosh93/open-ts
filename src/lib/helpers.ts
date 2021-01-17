import * as _ from "lodash";
import * as ts from "typescript";
import * as path from "path";
import { OpenAPIV3 } from "openapi-types";
import * as cg from "./ts-helpers";
import * as logs from "../utils/logs";
import { property } from "lodash";

const verbs = [
    "GET",
    "PUT",
    "POST",
    "DELETE",
    "OPTIONS",
    "HEAD",
    "PATCH",
    "TRACE"
];

const contentTypes = {
    "*/*": "json",
    "application/json": "json",
    "application/x-www-form-urlencoded": "form",
    "multipart/form-data": "multipart"
};

type FormatsMap = {
    [t: string]: {
        import: string;
        lib: "validator" | "transformer";
        syntax: string;
        tsType: string;
    };
};
const STRING_FORMATS_MAP: FormatsMap = {
    date: {
        import: "Type",
        lib: "transformer",
        syntax: "Type(() => Date)",
        tsType: "Date"
    },
    "date-time": {
        import: "Type",
        lib: "transformer",
        syntax: "Type(() => Date)",
        tsType: "Date"
    },
    email: {
        import: "IsEmail",
        lib: "validator",
        syntax: "IsEmail()",
        tsType: "string"
    },
    int64: {
        import: "IsInt",
        lib: "validator",
        syntax: "IsInt",
        tsType: "string"
    }
};

function getOperationIdentifier(id: string) {
    if (id.match(/[^\w\s]/)) return;
    id = _.camelCase(id);
    if (cg.isValidIdentifier(id)) return id;
}

function isNullable(schema: any) {
    return !!(schema && schema.nullable);
}

function isReference(obj: any): obj is OpenAPIV3.ReferenceObject {
    return obj && "$ref" in obj;
}

function capitalize(str: string) {
    return str[0].toUpperCase() + str.slice(1);
}

function formatUrlWithParams(rawPath: string) {
    const spans: Array<{ expression: ts.Expression; literal: string }> = [];
    const head = rawPath.replace(
        /(.*?)\{(.+?)\}(.*?)(?=\{|$)/g,
        (_substr, head, name, literal) => {
            const expression = _.camelCase(name);
            spans.push({
                expression: ts.createIdentifier(expression),
                literal
            });
            return head;
        }
    );
    return cg.createTemplateString(head, spans);
}

function queryParamsToObject(
    params: OpenAPIV3.ParameterObject[]
): OpenAPIV3.SchemaObject {
    const required = params.filter(p => p.required).map(p => p.name);
    const properties = {};
    params.forEach(p => {
        properties[p.name] = {
            ...p.schema,
            description: p.description
        };
    });
    return { type: "object", required, properties };
}

export default function generate(spec: OpenAPIV3.Document) {
    const typeDefinitions: ts.TypeAliasDeclaration[] = [];
    const enumDeclarations: ts.EnumDeclaration[] = [];
    const classes: ts.ClassDeclaration[] = [];
    const imports: ts.ImportDeclaration[] = [];
    const classValidatorDecorators = new Set<string>();
    const classTransformerDecorators = new Set<string>();
    const supportingValidatorClassesRefMap = new Map<string, string>();
    const supportingValidatorClassNamesMap: {
        [className: string]: number;
    } = {};

    function resolveIfRef<T>(obj: T | OpenAPIV3.ReferenceObject) {
        if (!isReference(obj)) return obj;
        const ref = obj.$ref;
        if (!ref.startsWith("#/")) {
            // NOTE: No need to support external refs as they will be bundled with the schema
            throw new Error(`External refs are not supported: ${ref}`);
        }
        const path = ref.slice(2).split("/");
        return _.get(spec, path) as T;
    }

    function resolveArray<T>(array?: Array<T | OpenAPIV3.ReferenceObject>) {
        return array ? array.map(resolveIfRef) : [];
    }

    const refsMap: { [ref: string]: ts.TypeReferenceNode } = {};
    const enumRefsMap: { [ref: string]: string } = {};

    function getRefAlias(obj: OpenAPIV3.ReferenceObject) {
        const { $ref } = obj;
        let ref = refsMap[$ref];
        if (!ref) {
            const schema = resolveIfRef<OpenAPIV3.SchemaObject>(obj);
            const name = schema.title || $ref.replace(/.+\//, "");
            if (schema.enum) {
                const enumName = name + "Enum";
                const enumNode = cg.createEnum(name + "Enum", schema.enum);
                enumRefsMap[$ref] = enumName;
                enumDeclarations.push(enumNode);
            }

            ref = refsMap[$ref] = ts.createTypeReferenceNode(name, undefined);

            const type = getTypeFromSchema(schema);
            typeDefinitions.push(
                cg.createTypeAliasDeclaration({
                    modifiers: [cg.modifier.export],
                    name,
                    type
                })
            );
        }
        return ref;
    }
    function getTypeFromSchema(
        schema?: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject
    ): ts.TypeNode {
        const type = getBaseTypeFromSchema(schema, {
            allowDateUnionTypes: true
        });
        if (isNullable(schema)) {
            return ts.createUnionTypeNode([type, cg.keywordType.null]);
        }
        return type;
    }

    function getBaseTypeFromSchema(
        schema?: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
        opts: {
            castDateFromString?: boolean;
            allowDateUnionTypes?: boolean;
        } = {
            castDateFromString: false,
            allowDateUnionTypes: false
        }
    ): ts.TypeNode {
        if (!schema) return cg.keywordType.any;
        if (isReference(schema)) {
            return getRefAlias(schema);
        }
        if (schema.oneOf) {
            return ts.createUnionTypeNode(schema.oneOf.map(getTypeFromSchema));
        }
        if (schema.allOf) {
            return ts.createIntersectionTypeNode(
                schema.allOf.map(getTypeFromSchema)
            );
        }
        if ("items" in schema) {
            return ts.createArrayTypeNode(getTypeFromSchema(schema.items));
        }

        if (schema.properties || schema.additionalProperties) {
            checkRequiredProperties(schema);
            return getTypeFromProperties(
                schema.properties || {},
                schema.required,
                schema.additionalProperties
            );
        }

        const isDate = (() => {
            const df = STRING_FORMATS_MAP[schema.format];
            if (!df) {
                return false;
            }
            return df.tsType === "Date";
        })();
        switch (schema.type) {
            case "string": {
                if (isDate) {
                    if (opts.castDateFromString) {
                        return cg.keywordType.Date;
                    }
                    if (opts.allowDateUnionTypes) {
                        return ts.createUnionTypeNode([
                            cg.keywordType.string,
                            cg.keywordType.Date
                        ]);
                    }
                }
                return cg.keywordType.string;
            }
            case "integer": {
                return cg.keywordType.number;
            }
            case "number":
            case "boolean":
            case "null": {
                return cg.keywordType[schema.type];
            }
            default:
                return cg.keywordType.any;
        }
    }

    function checkRequiredProperties(schema: OpenAPIV3.NonArraySchemaObject) {
        const properties = schema.properties || {};
        const all = Object.keys(properties).join(", ");
        (schema.required || []).forEach(key => {
            if (!(key in properties)) {
                logs.warn(`WARNING: '${key}' is missing in '${all}'`);
            }
        });
    }
    function getTypeFromProperties(
        props: {
            [prop: string]: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject;
        },
        required?: string[],
        additionalProperties?:
            | boolean
            | OpenAPIV3.SchemaObject
            | OpenAPIV3.ReferenceObject
    ) {
        const members: ts.TypeElement[] = Object.keys(props).map(name => {
            const schema = props[name];
            const isRequired = required && required.includes(name);
            return cg.createPropertySignature({
                questionToken: !isRequired,
                name,
                type: getTypeFromSchema(schema)
            });
        });
        if (additionalProperties) {
            const type =
                additionalProperties === true
                    ? cg.keywordType.any
                    : getTypeFromSchema(additionalProperties);

            members.push(cg.createIndexSignature(type));
        }
        return ts.createTypeLiteralNode(members);
    }

    function getOkResponse(res: OpenAPIV3.ResponsesObject) {
        const codes = Object.keys(res);
        const okCodes = codes.filter(
            code => codes.length === 1 || parseInt(code, 10) < 400
        );
        return res[okCodes[0]];
    }

    function getTypeFromResponses(
        res: OpenAPIV3.ResponsesObject,
        name: string
    ) {
        return getTypeFromResponse(getOkResponse(res), name);
    }

    function getTypeFromResponse(
        res: OpenAPIV3.ResponseObject | OpenAPIV3.ReferenceObject,
        name: string
    ) {
        res = resolveIfRef(res);
        if (isReference(res)) return getRefAlias(res);
        if (!res || !res.content) return cg.keywordType.void;
        return getTypeAlias(
            getSchemaFromContent(res.content),
            capitalize(name) + "ResponseBody"
        );
    }

    function getSchemaFromContent(content: any) {
        const contentType = Object.keys(contentTypes).find(t => t in content);
        let schema;
        if (contentType) {
            schema = _.get(content, [contentType, "schema"]);
        }
        return (
            schema || {
                type: "string"
            }
        );
    }

    const baseFile = cg.parseFile(path.resolve(__dirname, "../../base.ts"));

    const classMethods: ts.MethodDeclaration[] = [
        cg.createMethod(
            "constructor",
            {},
            [
                cg.createParameter("httpClient", {
                    type: ts.createTypeReferenceNode("HTTPClient", undefined)
                })
            ],
            cg.block(
                ts.createExpressionStatement(
                    ts.createAssignment(
                        ts.createPropertyAccess(ts.createThis(), "httpClient"),
                        ts.createIdentifier("httpClient")
                    )
                )
            )
        )
    ];

    function createValidatorAndTransformers(
        property:
            | OpenAPIV3.ArraySchemaObject
            | OpenAPIV3.NonArraySchemaObject
            | OpenAPIV3.ReferenceObject,
        propName: string,
        isRequired: boolean,
        enumName?: string
    ) {
        const params = resolveIfRef(property);
        const dec: ts.Decorator[] = [];
        let isOptional = false;
        if (isRequired) {
            classValidatorDecorators.add("IsNotEmpty");
            dec.push(cg.createDecorator("IsNotEmpty()"));
        } else {
            isOptional = true;
            classValidatorDecorators.add("IsOptional");
            dec.push(cg.createDecorator("IsOptional()"));
        }

        if (!isOptional && isNullable(params)) {
            classValidatorDecorators.add("ValidateIf");
            dec.push(
                cg.createDecorator(`ValidateIf(o => o.${propName} !== null)`)
            );
        }

        if (enumName) {
            classValidatorDecorators.add("IsEnum");
            dec.push(cg.createDecorator(`IsEnum(${enumName})`));
        }

        switch (params.type) {
            case "string": {
                const { minLength, maxLength, format, pattern } = params;
                if (minLength && maxLength) {
                    classValidatorDecorators.add("Length");
                    dec.push(
                        cg.createDecorator(`Length(${minLength}, ${maxLength})`)
                    );
                } else if (maxLength) {
                    classValidatorDecorators.add("MaxLength");
                    dec.push(cg.createDecorator(`MaxLength(${maxLength})`));
                } else if (minLength) {
                    classValidatorDecorators.add("MinLength");
                    dec.push(cg.createDecorator(`MinLength(${minLength})`));
                }
                if (format) {
                    const f = STRING_FORMATS_MAP[format];
                    if (!f) {
                        throw new Error("Can't find " + format);
                    }
                    if (f.lib === "validator") {
                        classValidatorDecorators.add(f.import);
                    } else {
                        classTransformerDecorators.add(f.import);
                    }
                    dec.push(cg.createDecorator(`${f.syntax}`));
                }
                if (pattern) {
                    classValidatorDecorators.add("Matches");
                    dec.push(cg.createDecorator(`Matches(/${pattern}/)`));
                }
                return dec;
            }
            case "number":
            case "integer": {
                const { minimum, maximum } = params;
                if (params.type === "integer") {
                    classValidatorDecorators.add("IsInt");
                    dec.push(cg.createDecorator(`IsInt()`));
                }
                if (minimum != null) {
                    classValidatorDecorators.add("Min");
                    dec.push(cg.createDecorator(`Min(${minimum})`));
                }
                if (maximum != null) {
                    classValidatorDecorators.add("Max");
                    dec.push(cg.createDecorator(`Max(${maximum})`));
                }
                return dec;
            }
            case "boolean": {
                classValidatorDecorators.add("IsBoolean");
                dec.push(cg.createDecorator(`IsBoolean()`));
                return dec;
            }
            case "array": {
                classValidatorDecorators.add("IsArray");
                dec.push(cg.createDecorator(`IsArray()`));
                if (isReference(params.items)) {
                    const enumNameForArray = enumRefsMap[params.items.$ref];
                    classValidatorDecorators.add("IsEnum");
                    dec.push(
                        cg.createDecorator(
                            `IsEnum(${enumNameForArray}, { each: true })`
                        )
                    );
                }
                return dec;
            }
            case "object": {
                if (!params.properties) {
                    classValidatorDecorators.add("IsObject");
                    dec.push(cg.createDecorator(`IsObject()`));
                    return dec;
                }
                const supportingValidatorClass = createSupportingValidatorClass(
                    property,
                    propName,
                    params
                );
                dec.push(cg.createDecorator(`ValidateNested()`));
                dec.push(
                    cg.createDecorator(
                        `Type(() => ${supportingValidatorClass}Validator)`
                    )
                );
                classValidatorDecorators.add("ValidateNested");
                classTransformerDecorators.add("Type");
                return dec;
            }
            default:
                break;
        }
    }

    function createSupportingValidatorClass(
        property:
            | OpenAPIV3.ReferenceObject
            | OpenAPIV3.ArraySchemaObject
            | OpenAPIV3.NonArraySchemaObject,
        propName: string,
        params: OpenAPIV3.NonArraySchemaObject
    ) {
        return (() => {
            if (isReference(property)) {
                const refClassName = property.$ref.replace(/.+\//, "");
                if (!supportingValidatorClassesRefMap.has(property.$ref)) {
                    createValidationClass(resolveIfRef(property), refClassName);
                }
                return refClassName;
            }
            const currNo = supportingValidatorClassNamesMap[propName];
            if (currNo === undefined) {
                supportingValidatorClassNamesMap[propName] = 1;
            } else {
                supportingValidatorClassNamesMap[propName] = currNo + 1;
            }
            const currClassName =
                capitalize(propName) +
                supportingValidatorClassNamesMap[propName];
            createValidationClass(params, currClassName);
            return currClassName;
        })();
    }

    function createValidationClass(
        schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
        name: string
    ) {
        const { properties, required } = resolveIfRef(schema);
        const requiredMap = getRequiredMap(required);
        if (!properties) {
            // NOTE: Validation classes only work for 'object' bodies with the exception of 'array' objects
            return;
        }
        classes.push(
            cg.createClassDeclaration({
                modifiers: [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
                members: Object.keys(properties).map(p => {
                    const property = properties[p];
                    const obj = resolveIfRef(property);
                    return cg.addComment(
                        cg.createProperty(p, {
                            decorators: createValidatorAndTransformers(
                                property,
                                p,
                                requiredMap[p],
                                isReference(property)
                                    ? enumRefsMap[property.$ref]
                                    : undefined
                            ),
                            type: getBaseTypeFromSchema(properties[p], {
                                castDateFromString: true
                            })
                        }),
                        obj.description || p
                    );
                }),
                name: name + "Validator"
            })
        );
    }

    const operationNames: Record<string, number> = {};

    Object.keys(spec.paths).forEach(path => {
        const item: OpenAPIV3.PathItemObject = spec.paths[path];
        Object.keys(resolveIfRef(item)).forEach(verb => {
            const method = verb.toUpperCase();
            if (!verbs.includes(method)) {
                throw new Error("Method is not supported: " + method);
            }

            const op: OpenAPIV3.OperationObject = (item as any)[verb];
            const {
                operationId,
                requestBody,
                responses,
                summary,
                description
            } = op;
            const operationName = getOperationIdentifier(operationId);

            if (!operationName) {
                throw new Error("Invalid: operationId is missing");
            }
            if (operationNames[operationName]) {
                throw new Error("Invalid: Duplicate operationId");
            }

            function getParams(
                item: OpenAPIV3.PathItemObject,
                op: OpenAPIV3.OperationObject
            ): {
                pathParams: OpenAPIV3.ParameterObject[];
                argNames: { [key: string]: string };
                queryParams: OpenAPIV3.ParameterObject[];
            } {
                const params = [
                    ...resolveArray(item.parameters),
                    ...resolveArray(op.parameters)
                ];

                const queryParams = params.filter(q => q.in === "query");
                const pathParams = params.filter(p => p.in === "path");

                const argNames: { [key: string]: string } = params
                    .sort((a, b) => a.name.length - b.name.length)
                    .reduce((prev, arg) => {
                        prev[arg.name] = _.camelCase(
                            arg.name.replace(/.+\./, "")
                        );
                        return prev;
                    }, {});
                return { pathParams, argNames, queryParams };
            }
            const { pathParams, argNames, queryParams } = getParams(item, op);

            const methodArgs = pathParams.map(p =>
                cg.createParameter(argNames[resolveIfRef(p).name], {
                    type: getTypeFromSchema(isReference(p) ? p : p.schema)
                })
            );
            const url = formatUrlWithParams(path);
            const args: ts.Expression[] = [url];

            if (!requestBody) {
                if (["post", "put", "patch"].includes(verb)) {
                    args.push(ts.createObjectLiteral());
                }
            } else {
                args.push(ts.createIdentifier("body"));
                const body = resolveIfRef(requestBody);
                const content = getSchemaFromContent(body.content);
                const bodyName = capitalize(operationName) + "RequestBody";
                const bodyTypeAlias = getTypeAlias(content, bodyName);
                createValidationClass(content, bodyName);
                methodArgs.push(
                    cg.createParameter("body", {
                        type: bodyTypeAlias
                    })
                );
            }

            if (queryParams.length) {
                const queryName = capitalize(operationName) + "Query";
                const querySchema = queryParamsToObject(queryParams);
                const queryTypeAlias = getTypeAlias(querySchema, queryName);
                createValidationClass(querySchema, queryName);
                methodArgs.push(
                    cg.createParameter(ts.createIdentifier("query"), {
                        type: queryTypeAlias
                    })
                );
            }

            if (queryParams.length) {
                args.push(ts.createIdentifier("query"));
            } else {
                args.push(ts.createObjectLiteral());
            }

            classMethods.push(
                cg.addComment(
                    cg.createMethod(
                        operationName,
                        {
                            modifiers: [
                                ts.createModifier(ts.SyntaxKind.AsyncKeyword)
                            ]
                        },
                        methodArgs,
                        cg.block(
                            ts.createReturn(
                                ts.createAsExpression(
                                    ts.createAwait(
                                        cg.createCall(
                                            ts.createPropertyAccess(
                                                ts.createThis(),
                                                "httpClient." + verb
                                            ),
                                            { args }
                                        )
                                    ),
                                    getTypeFromResponses(
                                        responses,
                                        operationName
                                    )
                                )
                            )
                        )
                    ),
                    summary || description
                )
            );
        });
    });
    const apiAgentClass = cg.createClassDeclaration({
        modifiers: [
            ts.createModifier(ts.SyntaxKind.ExportKeyword),
            ts.createModifier(ts.SyntaxKind.DefaultKeyword)
        ],
        name: "APIAgent",
        members: [
            cg.createProperty("httpClient", {
                type: ts.createTypeReferenceNode("HTTPClient", undefined)
            }),
            ...classMethods
        ]
    });
    imports.push(
        ts.createImportDeclaration(
            [],
            [],
            ts.createImportClause(
                undefined,
                ts.createNamedImports(
                    Array.from<string>(classValidatorDecorators).map(v =>
                        ts.createImportSpecifier(
                            undefined,
                            ts.createIdentifier(v)
                        )
                    )
                ),
                false
            ),
            ts.createLiteral("class-validator")
        )
    );
    imports.push(
        ts.createImportDeclaration(
            [],
            [],
            ts.createImportClause(
                undefined,
                ts.createNamedImports(
                    Array.from<string>(classTransformerDecorators).map(v =>
                        ts.createImportSpecifier(
                            undefined,
                            ts.createIdentifier(v)
                        )
                    )
                ),
                false
            ),
            ts.createLiteral("class-transformer")
        )
    );
    const completeFile = ts.factory.updateSourceFile(baseFile, [
        ...imports,
        ...baseFile.statements,
        ...typeDefinitions,
        ...enumDeclarations,
        ...classes,
        apiAgentClass
    ]);

    return completeFile;

    function getTypeAlias(bodySchema: any, bodyName: string) {
        const bodType = getTypeFromSchema(bodySchema);
        const bodyTypeAlias = ts.createTypeReferenceNode(bodyName, undefined);
        typeDefinitions.push(
            cg.createTypeAliasDeclaration({
                modifiers: [cg.modifier.export],
                name: bodyName,
                type: bodType
            })
        );
        return bodyTypeAlias;
    }
}
function getRequiredMap(required: string[]) {
    const requiredMap: { [p: string]: boolean; } = {};
    (required || []).forEach(p => (requiredMap[p] = true));
    return requiredMap;
}

