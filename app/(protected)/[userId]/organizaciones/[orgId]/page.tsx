import { redirect } from "next/navigation";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  redirect(`/dashboard/${slug}/tables`);
}
