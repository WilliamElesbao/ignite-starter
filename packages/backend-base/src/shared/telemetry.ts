import {
  type Attributes,
  context,
  type Span,
  SpanKind,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";

const tracer = trace.getTracer("backend-base");

export async function runWithSpan<T>(
  spanName: string,
  attributes: Attributes,
  fn: (spanAttributes: Attributes) => Promise<T>,
  options?: {
    parentSpan?: Span;
  },
): Promise<T> {
  const parentContext = options?.parentSpan
    ? trace.setSpan(context.active(), options.parentSpan)
    : context.active();

  return await tracer.startActiveSpan(
    spanName,
    { kind: SpanKind.INTERNAL },
    parentContext,
    async (span) => {
      try {
        const result = await fn(attributes);
        span.setAttributes(attributes);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setAttributes(attributes);
        span.recordException(error as Error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    },
  );
}
