"use client";

import type {
  GetStripeProductsResponse,
  GetStripeSubscriptionDetailsResponse,
} from "@repo/api/generated/api/types.gen";
import type { SessionResponse } from "@repo/backend-base";
import { CheckIcon, RefreshCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useDialog } from "@/context";
import {
  useSubscription,
  useUpdateSubscription,
} from "@/hooks/stripe/use-subscription";
import { formatPrice } from "@/utils";
import { Form, FormField } from "../ui/form";
import Badge from "./badge";

export const ChoosePlanDialog = ({
  user,
  products,
  subscription,
}: {
  user?: SessionResponse["user"];
  products?: GetStripeProductsResponse;
  subscription?: GetStripeSubscriptionDetailsResponse | null;
}) => {
  const { dialogIsOpen, setDialogIsOpen } = useDialog();
  const {
    form: subscriptionForm,
    onSubmit: subscriptionOnSubmit,
    isPending: isSubscriptionPending,
  } = useSubscription({
    priceId: subscription?.plan?.priceId ?? "",
  });
  const {
    form: updateSubscriptionForm,
    onSubmit: updateSubscriptionOnSubmit,
    isPending: isUpdateSubscriptionPending,
  } = useUpdateSubscription({
    priceId: subscription?.plan?.priceId ?? "",
  });

  const form = user?.stripeSubscriptionId
    ? updateSubscriptionForm
    : subscriptionForm;
  const onSubmit = user?.stripeSubscriptionId
    ? updateSubscriptionOnSubmit
    : subscriptionOnSubmit;

  // console.log("[ChoosePlanDialog] user", user);
  // console.log("[form]", form.getValues());

  const selectedPriceId = form.watch("priceId");
  const currentPriceId = subscription?.plan?.priceId;
  const isSamePlanSelected = selectedPriceId === currentPriceId;
  const isFreePlanSelected = selectedPriceId === "free";
  const isLoading = isSubscriptionPending || isUpdateSubscriptionPending;

  return (
    <Dialog open={dialogIsOpen} onOpenChange={(open) => setDialogIsOpen(open)}>
      <DialogContent>
        <div className="mb-2 flex flex-col gap-2">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full border"
            aria-hidden="true"
          >
            <RefreshCcwIcon className="opacity-80" size={16} />
          </div>
          <DialogHeader className="relative">
            <DialogTitle className="text-left">Change your plan</DialogTitle>
            <Badge text={subscription?.product?.name ?? "Free"} />
            <DialogDescription className="text-left">
              Pick one of the following plans.
            </DialogDescription>
          </DialogHeader>
        </div>
        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="priceId"
              render={({ field }) => (
                <RadioGroup
                  className="gap-2"
                  defaultValue={field.value}
                  onValueChange={(selectedId) => {
                    field.onChange(selectedId);
                    const selectedPlan = products?.find(
                      (p) => p.id === selectedId,
                    );
                    if (selectedPlan) {
                      form.setValue("planName", selectedPlan.planName);
                    }
                  }}
                >
                  {/* Radio card #1 */}
                  <div className="border-input has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-accent relative flex w-full items-center gap-2 rounded-md border px-4 py-3 shadow-xs outline-none">
                    <RadioGroupItem
                      value="free"
                      id={"free"}
                      className="order-1 after:absolute after:inset-0"
                      disabled={!subscription?.plan?.priceId}
                    />
                    <div className="grid grow gap-1">
                      <Label htmlFor={"free"}>Free</Label>
                      <p id={"free"} className="text-muted-foreground text-xs">
                        $0/month
                      </p>
                    </div>
                  </div>
                  {products
                    ?.toReversed()
                    .filter(
                      (product) => product.id !== subscription?.plan?.priceId,
                    )
                    .map((product) => (
                      <div
                        key={product.id}
                        className="border-input has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-accent relative flex w-full items-center gap-2 rounded-md border px-4 py-3 shadow-xs outline-none"
                      >
                        <RadioGroupItem
                          value={product.id}
                          id={product.id}
                          className="order-1 after:absolute after:inset-0"
                        />
                        <div className="grid grow gap-1">
                          <Label htmlFor={product.id}>{product.planName}</Label>
                          <p
                            id={`${product.id}-description`}
                            className="text-muted-foreground text-xs"
                          >
                            {formatPrice(product)}/
                            {product?.recurring?.interval_count === 1
                              ? product.recurring.interval
                              : `${product?.recurring?.interval_count} ${product?.recurring?.interval}s`}
                          </p>
                        </div>
                      </div>
                    ))}
                </RadioGroup>
              )}
            />

            <div className="space-y-3">
              <p>
                <strong className="text-sm font-medium">
                  Features include:
                </strong>
              </p>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="flex gap-2">
                  <CheckIcon
                    size={16}
                    className="text-primary mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  Create unlimited projects.
                </li>
                <li className="flex gap-2">
                  <CheckIcon
                    size={16}
                    className="text-primary mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  Remove watermarks.
                </li>
                <li className="flex gap-2">
                  <CheckIcon
                    size={16}
                    className="text-primary mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  Add unlimited users and free viewers.
                </li>
                <li className="flex gap-2">
                  <CheckIcon
                    size={16}
                    className="text-primary mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  Upload unlimited files.
                </li>
                <li className="flex gap-2">
                  <CheckIcon
                    size={16}
                    className="text-primary mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  7-day money back guarantee.
                </li>
                <li className="flex gap-2">
                  <CheckIcon
                    size={16}
                    className="text-primary mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  Advanced permissions.
                </li>
              </ul>
            </div>

            <div className="grid gap-2">
              <Button
                type="submit"
                className="w-full"
                disabled={isSamePlanSelected || isFreePlanSelected || isLoading}
              >
                {isLoading ? "Loading..." : "Change plan"}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="ghost" className="w-full">
                  Cancel
                </Button>
              </DialogClose>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
