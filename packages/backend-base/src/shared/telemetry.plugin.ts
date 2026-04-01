import {
  type Attributes,
  type Span,
  SpanKind,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";
import Elysia from "elysia";

const tracer = trace.getTracer("backend-base");

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

const getStatusCode = (status: unknown) => {
  if (typeof status === "number") {
    return status;
  }

  if (typeof status === "string") {
    const parsedStatus = Number.parseInt(status, 10);
    if (!Number.isNaN(parsedStatus)) {
      return parsedStatus;
    }
  }

  return 200;
};

const getStatusCodeFromResponse = (response: unknown) => {
  if (response instanceof Response) {
    return response.status;
  }

  return undefined;
};

export const telemetryPlugin = new Elysia({ name: "telemetry" })
  .state("span", undefined as Span | undefined)
  .state("attributes", {} as Attributes)
  .onRequest(({ request, store }) => {
    const url = new URL(request.url);
    const route = url.pathname;
    const userAgent = request.headers.get("user-agent") ?? undefined;
    const host = request.headers.get("host") ?? url.host;
    const clientAddress = getClientAddress(request);
    const span = tracer.startSpan(`${request.method} ${route}`, {
      kind: SpanKind.SERVER,
    });

    store.span = span;
    store.attributes = {
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

    if (route.startsWith("/auth")) {
      store.attributes["auth.route"] = true;
      store.attributes["auth.path"] = route;
    }

    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      activeSpan.setAttributes(store.attributes);
    }
  })
  .onAfterHandle(({ set, store, responseValue }) => {
    const span = store.span;

    if (!span) {
      return;
    }

    const responseStatusCode = getStatusCodeFromResponse(responseValue);
    const statusCode =
      typeof responseStatusCode === "number"
        ? responseStatusCode
        : getStatusCode(set.status);

    store.attributes["http.status_code"] = statusCode;
    store.attributes["http.response.status_code"] = statusCode;
    store.attributes.response_status_code = statusCode;

    span.setAttributes(store.attributes);
    span.setStatus({
      code: statusCode >= 400 ? SpanStatusCode.ERROR : SpanStatusCode.OK,
    });

    const activeSpan = trace.getActiveSpan();
    if (activeSpan && activeSpan !== span) {
      activeSpan.setAttributes(store.attributes);
      activeSpan.setStatus({
        code: statusCode >= 400 ? SpanStatusCode.ERROR : SpanStatusCode.OK,
      });
    }

    span.end();

    store.span = undefined;
    store.attributes = {};
  })
  .onError(({ error, store }) => {
    const span = store.span;
    const activeSpan = trace.getActiveSpan();

    if (activeSpan) {
      activeSpan.recordException(error as Error);
      activeSpan.setStatus({ code: SpanStatusCode.ERROR });
    }

    if (!span) {
      return;
    }

    span.setAttributes(store.attributes);

    span.recordException(error as Error);
    span.setStatus({ code: SpanStatusCode.ERROR });
  });
