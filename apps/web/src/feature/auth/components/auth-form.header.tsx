import Link from "next/link";
import { GiFox } from "rocketicons/gi";
import { RcRocketIcon } from "rocketicons/rc";
import { FieldDescription } from "@/components/ui/field";

interface AuthFormHeaderProps {
  mode: "sign-in" | "sign-up";
}

export const AuthFormHeader = ({ mode = "sign-in" }: AuthFormHeaderProps) => {
  const content =
    mode === "sign-in"
      ? {
          icon: <GiFox className="size-8 text-primary" />,
          description: "Don't have an account?",
          link: {
            href: "/sign-up",
            text: "Sign up",
          },
        }
      : {
          icon: <RcRocketIcon className="size-6 text-primary" />,
          description: "Already have an account?",
          link: {
            href: "/sign-in",
            text: "Sign in",
          },
        };

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <Link href="#" className="flex flex-col items-center gap-2 font-medium">
        <div className="flex size-8 items-center justify-center rounded-md">
          {content.icon}
        </div>
        <span className="sr-only">Ignite Starter</span>
      </Link>

      <Title />

      <FieldDescription>
        {content.description}{" "}
        <Link href={content.link.href}>{content.link.text}</Link>
      </FieldDescription>
    </div>
  );
};

const Title = () => {
  return (
    <h1 className="text-xl font-bold">
      Welcome to <span className="text-primary">Ignite Starter </span>
    </h1>
  );
};
