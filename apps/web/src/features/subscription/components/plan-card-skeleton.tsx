import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@repo/ui/components/ui/card";
import { Skeleton } from "@repo/ui/components/ui/skeleton";

export function PlanCardSkeleton({
  highlighted = false,
}: Readonly<{
  highlighted?: boolean;
}>) {
  return (
    <Card
      className={highlighted ? "border-primary/40 bg-primary/5" : undefined}
    >
      <CardHeader className="space-y-3 pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20" />
          {highlighted && <Skeleton className="h-5 w-24 rounded-full" />}
        </div>

        <div className="flex items-end gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <it's fine here because this is a static list of skeletons>
          <div key={index} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </CardContent>

      <CardFooter>
        <Skeleton className="h-10 w-full rounded-md" />
      </CardFooter>
    </Card>
  );
}
