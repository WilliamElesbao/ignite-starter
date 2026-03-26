import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: `${process.env.API_URL ?? "http://localhost:3333"}/openapi/json`,
  output: {
    path: "./generated/api",
    postProcess: [
      {
        args: ["run", "./src/scripts/fix-heyapi-headers.ts"],
        command: "bun",
        name: "Fix Hey API headers callback types",
      },
      {
        args: ["run", "./src/scripts/fix-unknown.ts"],
        command: "bun",
        name: "Replace unknown with null",
      },
      "biome:format",
      "biome:lint",
    ],
  },
  plugins: [
    "@hey-api/schemas",
    {
      enums: "javascript",
      exportFromIndex: false,
      name: "@hey-api/typescript",
    },
    {
      exportFromIndex: false,
      name: "@hey-api/sdk",
    },
    {
      exportFromIndex: false,
      name: "@hey-api/client-fetch",
      runtimeConfigPath: "../../src/lib/client/heyapi",
    },
    {
      exportFromIndex: false,
      name: "@tanstack/react-query",
    },
  ],
  parser: {
    transforms: {
      enums: "root",
    },
  },
});
