import { redirect } from "next/navigation";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ userId: string; orgId: string }>;
}) {
  const { userId, orgId } = await params;
  redirect(`/$}/${userId}/organization/${orgId}/tables`);
}
