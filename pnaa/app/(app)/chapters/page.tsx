import { ChapterList } from "@/components/chapters/chapter-list";
import { PageHeader } from "@/components/shared/page-header";

export default function ChaptersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Chapters"
        description="All PNAA chapters across the United States"
      />
      <ChapterList />
    </div>
  );
}
