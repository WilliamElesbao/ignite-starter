import { cn } from "@/lib/shadcn/utils";

export const AuthFormRoot = ({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {children}
    </div>
  );
};
