import type { GetSessionResponse } from "@repo/api/generated/api/types.gen";

export type User = NonNullable<GetSessionResponse>["user"];
