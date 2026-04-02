import {
  type Attributes,
  type Span,
  SpanKind,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";
import Elysia from "elysia";

const tracer = trace.getTracer("backend-base");

type TelemetryRequestState = {
  span: Span;
  attributes: Attributes;
};

const requestTelemetryState = new WeakMap<Request, TelemetryRequestState>();

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

const finalizeSpan = ({
  request,
  setStatus,
  responseValue,
}: {
  request: Request;
  setStatus: unknown;
  responseValue: unknown;
}) => {
  const state = requestTelemetryState.get(request);

  if (!state) {
    return;
  }

  const { span, attributes } = state;

  const responseStatusCode = getStatusCodeFromResponse(responseValue);
  const statusCode =
    typeof responseStatusCode === "number"
      ? responseStatusCode
      : getStatusCode(setStatus);

  attributes["http.status_code"] = statusCode;
  attributes["http.response.status_code"] = statusCode;
  attributes.response_status_code = statusCode;

  span.setAttributes(attributes);
  span.setStatus({
    code: statusCode >= 400 ? SpanStatusCode.ERROR : SpanStatusCode.OK,
  });

  span.end();

  requestTelemetryState.delete(request);
};

export const telemetryPlugin = new Elysia({ name: "telemetry" })
  .state("attributes", {} as Attributes)
  .onRequest(({ request, store }) => {
    if (requestTelemetryState.has(request)) {
      return;
    }

    const url = new URL(request.url);
    const route = url.pathname;
    const userAgent = request.headers.get("user-agent") ?? undefined;
    const host = request.headers.get("host") ?? url.host;
    const clientAddress = getClientAddress(request);
    const span = tracer.startSpan(`${request.method} ${route}`, {
      kind: SpanKind.SERVER,
    });

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

    if (route.startsWith("/auth")) {
      attributes["auth.route"] = true;
      attributes["auth.path"] = route;
    }

    span.setAttributes(attributes);
    store.attributes = attributes;

    requestTelemetryState.set(request, {
      span,
      attributes,
    });
  })
  .onAfterHandle(({ request, set, responseValue }) => {
    finalizeSpan({
      request,
      setStatus: set.status,
      responseValue,
    });
  })
  .mapResponse(({ request, set, responseValue }) => {
    finalizeSpan({
      request,
      setStatus: set.status,
      responseValue,
    });
  })
  .onAfterResponse(({ request, set, responseValue }) => {
    finalizeSpan({
      request,
      setStatus: set.status,
      responseValue,
    });
  })
  .onError(({ error, request }) => {
    const state = requestTelemetryState.get(request);
    const span = state?.span;
    const activeSpan = trace.getActiveSpan();

    if (activeSpan) {
      activeSpan.recordException(error as Error);
      activeSpan.setStatus({ code: SpanStatusCode.ERROR });
    }

    if (!span || !state) {
      return;
    }

    span.setAttributes(state.attributes);

    span.recordException(error as Error);
    span.setStatus({ code: SpanStatusCode.ERROR });

    span.end();
    requestTelemetryState.delete(request);
  });
