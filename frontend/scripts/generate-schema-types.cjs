const fs = require("fs");
const path = require("path");
const { buildSchema, GraphQLEnumType } = require("graphql");

const repoRoot = path.resolve(__dirname, "..", "..");
const backendSchemaPath = path.join(repoRoot, "backend", "src", "schema.ts");
const outputPath = path.join(repoRoot, "frontend", "src", "shared", "gql", "__generated__", "schema-types.ts");

const schemaSource = fs.readFileSync(backendSchemaPath, "utf8");
const sdlMatch = schemaSource.match(/buildSchema\(`([\s\S]*?)`\)/);

if (!sdlMatch || !sdlMatch[1]) {
  throw new Error("Could not extract GraphQL SDL from backend/src/schema.ts");
}

const schema = buildSchema(sdlMatch[1]);

const typeMap = schema.getTypeMap();
const enumTypes = Object.values(typeMap)
  .filter((type) => type instanceof GraphQLEnumType)
  .filter((type) => !type.name.startsWith("__"));

const lines = [
  "/* eslint-disable */",
  "// This file is auto-generated from backend GraphQL schema. Do not edit manually.",
  "",
];

for (const enumType of enumTypes) {
  const values = enumType
    .getValues()
    .map((value) => `\"${value.name}\"`)
    .join(" | ");

  lines.push(`export type ${enumType.name} = ${values};`);
}

lines.push("");

fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
console.log(`Generated ${outputPath}`);
