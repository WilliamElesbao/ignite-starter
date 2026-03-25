"use client";

import Link from "next/link";
import * as IconsGi from "rocketicons/gi";
import * as IconsSi from "rocketicons/si";
import { Button } from "@/components/ui/button";
import { signIn } from "@/hooks/auth";
import { cn } from "@/lib/utils";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <Link
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <IconsGi.GiFox className="size-8 text-primary" />
              </div>
              <span className="sr-only">Fox Starter</span>
            </Link>
            <h1 className="font-bold text-xl">
              Welcome to <span className="text-primary">Fox</span> Starter
            </h1>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Button variant="outline" type="button" className="w-full" disabled>
              <IconsSi.SiGithub className="size-5" />
            </Button>
            <Button variant="outline" type="button" className="w-full" disabled>
              <IconsSi.SiApple className="size-5" />
            </Button>
            <Button
              variant="outline"
              type="button"
              className="w-full"
              onClick={signIn}
            >
              <IconsSi.SiGoogle className="size-5" />
            </Button>
          </div>
        </div>
      </form>
      <div className="text-balance text-center text-muted-foreground text-xs *:[a]:underline *:[a]:underline-offset-4 *:[a]:hover:text-primary">
        This project is an open-source starter kit built for developers who want
        to accelerate product development with best practices. By clicking
        continue, you'll unlock the features of this developer-friendly
        open-source starter.
      </div>
    </div>
  );
}
