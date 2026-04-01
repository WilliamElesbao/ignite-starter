import Link from "next/link";
import { useTranslations } from "next-intl";
import { GiFox } from "rocketicons/gi";
import { RcRocketIcon } from "rocketicons/rc";
import { FieldDescription } from "@/components/ui/field";

interface AuthFormHeaderProps {
  mode: "sign-in" | "sign-up";
}

export const AuthFormHeader = ({ mode = "sign-in" }: AuthFormHeaderProps) => {
  const t = useTranslations();

  const content =
    mode === "sign-in"
      ? {
          icon: <GiFox className="size-8 text-primary" />,
          description: t("sign-in.dont-have-an-account"),
          link: {
            href: "/sign-up",
            text: t("common.sign-up"),
          },
        }
      : {
          icon: <RcRocketIcon className="size-6 text-primary" />,
          description: t("sign-up.already-have-an-account"),
          link: {
            href: "/sign-in",
            text: t("common.sign-in"),
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
  const t = useTranslations("sign-in");

  return (
    <h1 className="text-xl font-bold">
      {t.rich("welcome-to-ignite-starter", {
        highlight: (chunks) => <span className="text-primary">{chunks}</span>,
      })}
    </h1>
  );
};
