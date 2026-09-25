import { Suspense } from "react";
import SurveyEngine from "@/components/SurveyEngine";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Survey — Kolaba Cloud AI Engineering Colleges Program",
  description:
    "Typeform-style conversational survey for students, faculty, TPOs, and college administrators.",
};

export default function SurveyPage() {
  return (
    <div className="py-6 sm:py-10">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <span className="text-sm font-medium">Loading survey questions...</span>
            </div>
          </div>
        }
      >
        <SurveyEngine />
      </Suspense>
    </div>
  );
}
