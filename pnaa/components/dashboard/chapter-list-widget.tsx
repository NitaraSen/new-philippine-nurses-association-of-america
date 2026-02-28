"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpRight } from "lucide-react";
import { slugify } from "@/lib/utils";
import type { Chapter } from "@/types/chapter";

export function ChapterListWidget({
  chapters,
}: {
  chapters: (Chapter & { id: string })[];
}) {
  const sorted = [...chapters].sort((a, b) => b.totalMembers - a.totalMembers);
  const top = sorted.slice(0, 10);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Chapter Overview</CardTitle>
        <Link
          href="/chapters"
          className="text-sm text-primary flex items-center gap-1 hover:underline"
        >
          View all <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chapter</TableHead>
              <TableHead>Region</TableHead>
              <TableHead className="text-right">Active</TableHead>
              <TableHead className="text-right">Lapsed</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {top.map((chapter) => (
              <TableRow key={chapter.id}>
                <TableCell>
                  <Link
                    href={`/chapters/${chapter.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {chapter.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {chapter.region}
                </TableCell>
                <TableCell className="text-right">
                  {chapter.totalActive}
                </TableCell>
                <TableCell className="text-right">
                  {chapter.totalLapsed}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {chapter.totalMembers}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
