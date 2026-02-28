import { ChapterDetail } from "@/components/chapters/chapter-detail";

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = await params;
  return <ChapterDetail chapterId={chapterId} />;
}
