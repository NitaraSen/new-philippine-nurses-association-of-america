import { Skeleton } from "@/components/ui/skeleton";

export default function ChapterDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-24 mt-1" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}
