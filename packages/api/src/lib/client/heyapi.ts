import type { CreateClientConfig } from "../../../generated/api/client";

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: process.env.API_URL ?? "http://localhost:3333",
  headers: {
    Authorization: "",
    "Content-Type": "application/json",
  },
});
