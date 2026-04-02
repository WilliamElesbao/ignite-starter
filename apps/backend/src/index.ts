import { opentelemetry } from "@elysiajs/opentelemetry";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
  type SpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { startOpenTelemetry } from "./instrumentation";
import { telemetryPlugin } from "./telemetry.plugin";

await startOpenTelemetry();

const [{ default: openapi }, { Elysia }, backendBase] = await Promise.all([
  import("@elysiajs/openapi"),
  import("elysia"),
  import("@repo/backend-base"),
]);

const {
  emailPlugin,
  OpenAPI,
  stripePlugin,
  subscriptionExpirationCron,
  userPlugin,
} = backendBase;

const tracesExportUrl =
  process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ??
  `${(process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318").replace(/\/$/, "")}/v1/traces`;

const spanProcessors: SpanProcessor[] = [
  new BatchSpanProcessor(
    new OTLPTraceExporter({
      url: tracesExportUrl,
    }),
  ),
];

if (process.env.OTEL_DEBUG_CONSOLE_EXPORTER === "true") {
  spanProcessors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()));
}

const app = new Elysia()
  .use(
    opentelemetry({
      serviceName: process.env.OTEL_SERVICE_NAME ?? "backend",
      spanProcessors,
    }),
  )
  .use(telemetryPlugin)
  .use(
    openapi({
      provider: "scalar",
      documentation: {
        tags: [
          { name: "Better Auth", description: "Authentication endpoints" },
          { name: "User", description: "Endpoints related to user management" },
          {
            name: "Email",
            description: "Endpoints related to email functionality",
          },
          {
            name: "Stripe",
            description: "Endpoints related to Stripe integration",
          },
        ],
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
      },
    }),
  )
  .use(subscriptionExpirationCron)
  .use(userPlugin)
  .use(emailPlugin)
  .use(stripePlugin);

app.listen(process.env.PORT ?? 3333);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
