import { redirect } from "next/navigation";
import { getSurveyById } from "@/lib/surveyStorage";

export default async function AdminSurveyPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const survey = await getSurveyById(id);
  const targetSlug = survey?.slug || id;
  redirect(`/surveys/${targetSlug}`);
}
