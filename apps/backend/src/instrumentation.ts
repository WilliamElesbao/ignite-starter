import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  BatchSpanProcessor,
  type ReadableSpan,
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

export async function startOpenTelemetry() {
  if (globalThis.__otelSdk) return;

  const traceExporter = new OTLPTraceExporter();

  const sdk = new NodeSDK({
    spanProcessors: [
      new SignozListViewAttributesProcessor(),
      new BatchSpanProcessor(traceExporter),
    ],
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
