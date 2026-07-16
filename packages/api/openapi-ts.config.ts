import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: `${process.env.API_URL}/openapi/json`,
  output: {
    path: "./generated/api",
    // postProcess: ["biome:format"],
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
      runtimeConfigPath: "./src/lib/client/heyapi",
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
