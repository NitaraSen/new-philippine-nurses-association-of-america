import { CampaignDetail } from "@/components/fundraising/campaign-detail";

export default async function FundraisingItemPage({
  params,
}: {
  params: Promise<{ fundraisingId: string }>;
}) {
  const { fundraisingId } = await params;
  return <CampaignDetail campaignId={fundraisingId} />;
}
