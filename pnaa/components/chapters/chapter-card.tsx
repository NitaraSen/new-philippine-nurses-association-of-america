"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Building2, Users } from "lucide-react";
import type { Chapter } from "@/types/chapter";

export function ChapterCard({
  chapter,
}: {
  chapter: Chapter & { id: string };
}) {
  return (
    <Link href={`/chapters/${chapter.id}`}>
      <Card className="transition-all hover:shadow-md hover:border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-2">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{chapter.name}</h3>
              <p className="text-xs text-muted-foreground">{chapter.region}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{chapter.totalMembers} members</span>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="text-green-600">{chapter.totalActive} active</span>
              <span className="text-amber-600">{chapter.totalLapsed} lapsed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
