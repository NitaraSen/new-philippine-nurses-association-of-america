import { Skeleton } from "@/components/ui/skeleton";

export default function CampaignDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}
