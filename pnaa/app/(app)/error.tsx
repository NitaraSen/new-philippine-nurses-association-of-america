"use client";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground max-w-md">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
