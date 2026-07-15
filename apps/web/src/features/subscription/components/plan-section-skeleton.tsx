import { PlanCardSkeleton } from "./plan-card-skeleton";

export function PlanSectionSkeleton() {
  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PlanCardSkeleton />
        <PlanCardSkeleton highlighted />
      </div>
    </section>
  );
}
