import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Chargement">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
