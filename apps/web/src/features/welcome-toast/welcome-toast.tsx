import { cookies } from "next/headers";
import { WelcomeToastTrigger } from "./components/welcome-toast-trigger";
import { WELCOME_COOKIE } from "./constants/welcome-cookie";

export async function WelcomeToast() {
  const cookieStore = await cookies();
  const shouldShow =
    cookieStore.get(WELCOME_COOKIE.key)?.value === WELCOME_COOKIE.value;

  return <WelcomeToastTrigger show={shouldShow} />;
}
