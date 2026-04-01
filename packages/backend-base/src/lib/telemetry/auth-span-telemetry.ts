import { SpanStatusCode, trace } from "@opentelemetry/api";

export const setAuthSpanTelemetry = (ctx: unknown, statusCode?: number) => {
  const span = trace.getActiveSpan();
  if (!span) {
    return;
  }

  const authContext = ctx as {
    path?: string;
    request?: Request;
  };

  const method = authContext.request?.method;
  const path = authContext.path;
  const fullPath = path?.startsWith("/auth")
    ? path
    : path
      ? `/auth${path}`
      : undefined;

  if (method) {
    span.setAttribute("http.method", method);
    span.setAttribute("http.request.method", method);
    span.setAttribute("http_method", method);
  }

  if (path) {
    span.setAttribute("http.route", path);
    span.setAttribute("url.path", path);
    span.setAttribute("auth.path", path);
  }

  if (fullPath) {
    span.setAttribute("auth.full_path", fullPath);
  }

  span.setAttribute("auth.route", true);

  if (typeof statusCode === "number") {
    span.setAttribute("http.status_code", statusCode);
    span.setAttribute("http.response.status_code", statusCode);
    span.setAttribute("response_status_code", statusCode);
    span.setStatus({
      code: statusCode >= 400 ? SpanStatusCode.ERROR : SpanStatusCode.OK,
    });
  }
};
