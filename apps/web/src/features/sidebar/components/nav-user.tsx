import { getSessionAction } from "@/action/get-session.action";
import { NavUserDropdown } from "./nav-user-dropdown";

export async function NavUser() {
  const session = await getSessionAction();
  if (!session?.user) return null;

  return (
    <NavUserDropdown
      name={session.user.name}
      email={session.user.email}
      image={session.user.image ?? null}
    />
  );
}
