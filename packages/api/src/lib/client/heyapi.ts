import type { CreateClientConfig } from "../../../generated/api/client";

const baseUrl = process.env.API_URL ?? "http://localhost:3000";

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: `${baseUrl}/api`,
  credentials: "include",
  headers: {
    Authorization: "",
    "Content-Type": "application/json",
  },
});
