import { redirect } from "next/navigation";

export default async function AdminSurveyAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/analytics?surveyId=${id}`);
}
