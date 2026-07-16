"use client";

import { Button } from "@repo/ui/components/ui/button";
import { IconLoader, IconMail } from "@tabler/icons-react";
import { useSendEmail } from "@/hooks/email/email.mutations";

export function SendEmailButton() {
  const { mutate, isPending } = useSendEmail();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="hidden sm:flex border"
      onClick={() => mutate({})}
      disabled={isPending}
    >
      {isPending ? (
        <IconLoader className="size-5 animate-spin" />
      ) : (
        <IconMail className="size-5" />
      )}
    </Button>
  );
}
