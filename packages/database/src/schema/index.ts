import { accounts } from "./accounts";
import { sessions } from "./sessions";
import { users } from "./users";
import { verifications } from "./verifications";

export type { Accounts } from "./accounts";
export type { Sessions } from "./sessions";
export type { Users } from "./users";
export type { Verifications } from "./verifications";

export const schema = {
  users,
  accounts,
  sessions,
  verifications,
};
