import { t } from "elysia";

export const ErrorDto = t.Object({
  code: t.String(),
  message: t.String(),
});

export const createErrorDto = <const TCodes extends readonly string[]>(
  codes: TCodes,
) =>
  t.Object({
    code: t.String({ enum: [...codes] }),
    message: t.String(),
  });
