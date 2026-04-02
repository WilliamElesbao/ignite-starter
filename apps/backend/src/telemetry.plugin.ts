import type { Attributes } from "@opentelemetry/api";
import { Elysia } from "elysia";

const getClientAddress = (request: Request) => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return undefined;
};

export const telemetryPlugin = new Elysia({ name: "telemetry" })
  .state("attributes", {} as Attributes)
  .onRequest(({ request, store }) => {
    const url = new URL(request.url);
    const route = url.pathname;

    if (process.env.OTEL_DEBUG_REQUEST_LOGS === "true") {
      console.info(`[telemetry] onRequest ${request.method} ${route}`);
    }

    const userAgent = request.headers.get("user-agent") ?? undefined;
    const host = request.headers.get("host") ?? url.host;
    const clientAddress = getClientAddress(request);

    const attributes: Attributes = {
      "http.method": request.method,
      "http.request.method": request.method,
      http_method: request.method,
      "http.route": route,
      "http.target": `${url.pathname}${url.search}`,
      route,
      "url.full": request.url,
      "url.path": route,
      "url.query": url.search,
      "url.scheme": url.protocol.replace(":", ""),
      "server.address": url.hostname,
      "server.port": url.port || undefined,
      "http.host": host,
      "user_agent.original": userAgent,
      "http.user_agent": userAgent,
      "client.address": clientAddress,
      "network.peer.address": clientAddress,
    };

    store.attributes = attributes;
  });
