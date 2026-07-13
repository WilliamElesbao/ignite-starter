import { getSession } from "@/lib/better-auth/auth-server";
import { NavUserDropdown } from "./nav-user-dropdown";

export async function NavUser() {
  const session = await getSession();
  if (!session?.user) return null;

  return (
    <NavUserDropdown
      name={session.user.name}
      email={session.user.email}
      image={session.user.image ?? null}
    />
  );
}
