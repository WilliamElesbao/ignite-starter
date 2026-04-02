import { opentelemetry } from "@elysiajs/opentelemetry";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { PgInstrumentation } from "@opentelemetry/instrumentation-pg";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";

export const instrumentation = opentelemetry({
  serviceName: Bun.env.OTEL_SERVICE_NAME ?? "origin-backend",
  spanProcessors: [
    new BatchSpanProcessor(
      new OTLPTraceExporter({
        url: `${Bun.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318"}/v1/traces`,
      }),
    ),
  ],
  instrumentations: [new PgInstrumentation()],
});
