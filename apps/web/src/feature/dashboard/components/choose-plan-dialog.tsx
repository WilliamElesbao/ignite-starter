"use client";

import type {
  GetStripeProductsResponse,
  GetStripeSubscriptionDetailsResponse,
} from "@repo/api/generated/api/types.gen";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import { Form, FormField } from "@repo/ui/components/ui/form";
import { Label } from "@repo/ui/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/ui/radio-group";
import { CheckIcon, RefreshCcwIcon } from "lucide-react";
import { useDialog } from "@/context/dialog-context";
import { useSubscriptionForm } from "@/hooks/stripe/use-subscription-form";
import { formatPrice } from "@/utils";

export const ChoosePlanDialog = ({
  products,
  subscription,
}: {
  products?: GetStripeProductsResponse;
  subscription?: GetStripeSubscriptionDetailsResponse | null;
}) => {
  const { form, onSubmit, isLoading, disableChangePlanButton } =
    useSubscriptionForm();
  const { dialogIsOpen, setDialogIsOpen } = useDialog();

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
          <form
            className="space-y-5"
            onSubmit={form.handleSubmit(onSubmit, (err) => {
              console.error("[ChoosePlanDialog] Form submission error:", err);
            })}
          >
            <FormField
              control={form.control}
              name="priceId"
              render={({ field }) => (
                <RadioGroup
                  className="gap-2"
                  value={field.value ?? "free"}
                  onValueChange={(value) => {
                    field.onChange(value);
                    const selectedProduct = products?.find(
                      (product) => product.id === value,
                    );
                    if (selectedProduct) {
                      form.setValue("planName", selectedProduct.planName);
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
                    ?.filter((product) => product.currency === "usd")
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
                disabled={disableChangePlanButton}
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
