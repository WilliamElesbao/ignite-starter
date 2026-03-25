import { WelcomeEmail } from "@repo/emails/templates";
import { useGetUserById } from "./hooks/user/user.queries";

export const PageDemo = () => {
  const { data } = useGetUserById();

  return (
    <div>
      <h1>Page Demo</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <WelcomeEmail name="John Doe" />
    </div>
  );
};
