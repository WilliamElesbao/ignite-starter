import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
  type ReadableSpan,
  SimpleSpanProcessor,
  type Span,
  type SpanProcessor,
} from "@opentelemetry/sdk-trace-base";

declare global {
  var __otelSdk: NodeSDK | undefined;
}

const shutdownSignals: NodeJS.Signals[] = ["SIGTERM", "SIGINT"];

class SignozListViewAttributesProcessor implements SpanProcessor {
  onStart(_span: Span): void {}

  onEnd(span: ReadableSpan): void {
    const attributes = span.attributes as Record<string, unknown>;

    const httpMethod =
      typeof attributes.http_method === "string"
        ? attributes.http_method
        : typeof attributes["http.request.method"] === "string"
          ? attributes["http.request.method"]
          : typeof attributes["http.method"] === "string"
            ? attributes["http.method"]
            : undefined;

    if (typeof httpMethod === "string") {
      attributes.http_method = httpMethod;
      attributes["http.method"] = httpMethod;
      attributes["http.request.method"] = httpMethod;
    }

    const responseStatusCode =
      typeof attributes.response_status_code === "number"
        ? attributes.response_status_code
        : typeof attributes["http.response.status_code"] === "number"
          ? attributes["http.response.status_code"]
          : typeof attributes["http.status_code"] === "number"
            ? attributes["http.status_code"]
            : undefined;

    if (typeof responseStatusCode === "number") {
      attributes.response_status_code = responseStatusCode;
      attributes["http.status_code"] = responseStatusCode;
      attributes["http.response.status_code"] = responseStatusCode;
    }
  }

  async forceFlush(): Promise<void> {}

  async shutdown(): Promise<void> {}
}

const getTracesExportUrl = () => {
  const explicitTracesEndpoint = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
  if (explicitTracesEndpoint) {
    return explicitTracesEndpoint;
  }

  const baseEndpoint = (
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318"
  ).replace(/\/$/, "");

  return `${baseEndpoint}/v1/traces`;
};

export async function startOpenTelemetry() {
  if (globalThis.__otelSdk) return;

  if (!process.env.OTEL_SERVICE_NAME) {
    process.env.OTEL_SERVICE_NAME = "backend";
  }

  const tracesExportUrl = getTracesExportUrl();
  console.info(
    `[otel] service=${process.env.OTEL_SERVICE_NAME} traces=${tracesExportUrl}`,
  );

  const traceExporter = new OTLPTraceExporter({
    url: tracesExportUrl,
  });

  const spanProcessors: SpanProcessor[] = [
    new SignozListViewAttributesProcessor(),
    new BatchSpanProcessor(traceExporter),
  ];

  if (process.env.OTEL_DEBUG_CONSOLE_EXPORTER === "true") {
    spanProcessors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  }

  const sdk = new NodeSDK({
    spanProcessors,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  await sdk.start();
  globalThis.__otelSdk = sdk;

  for (const signal of shutdownSignals) {
    process.once(signal, async () => {
      await globalThis.__otelSdk?.shutdown();
      globalThis.__otelSdk = undefined;
    });
  }
}
