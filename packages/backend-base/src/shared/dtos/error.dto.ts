import { t } from "elysia";

export const createErrorDto = <const TCodes extends readonly string[]>(
  codes: TCodes,
) =>
  t.Object({
    code: t.String({ enum: [...codes] }),
    message: t.String(),
  });
