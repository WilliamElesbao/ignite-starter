import type { CreateClientConfig } from "@/api/generated/api/client";

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: process.env.API_URL ?? "http://localhost:4000",
  headers: {
    Authorization: "",
    "Content-Type": "application/json",
  },
});
