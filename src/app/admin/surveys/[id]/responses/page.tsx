import { redirect } from "next/navigation";

export default async function AdminSurveyResponsesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/responses?surveyId=${id}`);
}
