"use client";

import { Button } from "@repo/ui/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/ui/dialog";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { CircleAlertIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useCancelSubscription } from "@/hooks/stripe/useSubscription";

const PHRASE = "Yes, I'd like to cancel my subscription";

export default function CancelSubscriptionDialog() {
  const { onSubmit, isPending, isSuccess } = useCancelSubscription();

  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);

  const id = useId();

  useEffect(() => {
    if (isSuccess) {
      setOpen(false);
      setInputValue("");
    }
  }, [isSuccess]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Revoke subscription</Button>
      </DialogTrigger>
      <DialogContent>
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full border"
            aria-hidden="true"
          >
            <CircleAlertIcon className="opacity-80" size={16} />
          </div>
          <DialogHeader>
            <DialogTitle className="sm:text-center">
              Final confirmation
            </DialogTitle>
            <DialogDescription className="sm:text-center">
              This action cannot be undone. To confirm, please enter the phrase{" "}
              <span className="text-foreground">
                Yes, I'd like to cancel my subscription
              </span>
            </DialogDescription>
          </DialogHeader>
        </div>

        <form className="space-y-5">
          <div className="*:not-first:mt-2">
            <Label htmlFor={id}>Phrase</Label>
            <Input
              id={id}
              type="text"
              placeholder="Type 'Yes, I'd like to cancel my subscription' to confirm"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="flex-1">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              className="flex-1"
              disabled={inputValue !== PHRASE || isPending}
              onClick={() => onSubmit()}
            >
              {isPending ? "Loading..." : "Revoke subscription"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
