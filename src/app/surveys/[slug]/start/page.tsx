"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Loader2,
  AlertCircle,
  Star,
  ShieldCheck,
  Building2,
  X,
  Phone,
  User,
  Mail,
} from "lucide-react";
import { SurveySchema, SurveyQuestion, LogicRule } from "@/types/schema";
import RespondentAuthModal, { RespondentUser } from "@/components/RespondentAuthModal";
import SurveyEngine from "@/components/SurveyEngine";

export default function SurveyRunnerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  const normalizedSlug = (slug || "").toLowerCase();
  const isKolaba =
    normalizedSlug === "engineering-colleges-program" ||
    normalizedSlug === "eng-ai-colleges-2025" ||
    normalizedSlug === "surv_eng_01" ||
    normalizedSlug === "kolaba" ||
    normalizedSlug === "kolaba-cloud" ||
    normalizedSlug === "kolaba-cloud-ai" ||
    normalizedSlug === "kolabacloud" ||
    (normalizedSlug.includes("kolaba") && (normalizedSlug.includes("college") || normalizedSlug.includes("ai")));

  if (isKolaba) {
    return (
      <div className="py-6 sm:py-10">
        <SurveyEngine />
      </div>
    );
  }

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [survey, setSurvey] = useState<SurveySchema | null>(null);

  const [respondentUser, setRespondentUser] = useState<RespondentUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState<boolean>(false);

  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check existing session
  useEffect(() => {
    try {
      const stored =
        typeof window !== "undefined"
          ? sessionStorage.getItem("kolaba_respondent_user") ||
            localStorage.getItem("kolaba_respondent_user")
          : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.phone || parsed.email || parsed.name)) {
          setRespondentUser(parsed);
          setShowAuthModal(false);
          prefillRespondentAnswers(parsed);
          checkDuplicateSubmission(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, [slug]);

  const checkDuplicateSubmission = async (user: RespondentUser) => {
    if (typeof window !== "undefined" && survey) {
      const localFlag = localStorage.getItem(`survey_submitted_${survey.id}_${user.phone || user.email}`);
      if (localFlag) {
        setAlreadySubmitted(true);
        return;
      }
    }

    try {
      const query = new URLSearchParams({
        surveyId: slug,
        email: user.email || "",
        phone: user.phone || "",
      });
      const res = await fetch(`/api/survey/check-submission?${query.toString()}`);
      const data = await res.json();
      if (data.alreadySubmitted) {
        setAlreadySubmitted(true);
      }
    } catch {
      // silent
    }
  };

  const prefillRespondentAnswers = (user: RespondentUser) => {
    setAnswers((prev) => ({
      ...prev,
      respondent_name: user.name,
      respondent_email: user.email,
      respondent_phone: user.phone,
      name: prev.name || user.name,
      email: prev.email || user.email,
      phone: prev.phone || user.phone,
    }));
  };

  const handleAuthenticated = (user: RespondentUser) => {
    setRespondentUser(user);
    setShowAuthModal(false);
    prefillRespondentAnswers(user);
    checkDuplicateSubmission(user);
  };

  useEffect(() => {
    fetchSurvey();
  }, [slug]);

  const fetchSurvey = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/surveys/${slug}`);
      const data = await res.json();
      if (data.success && data.survey) {
        setSurvey(data.survey);
      } else {
        setError(data.error || "Survey not found");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load survey");
    } finally {
      setLoading(false);
    }
  };

  // Evaluate conditional visibility for a question
  const isQuestionVisible = (qId: string): boolean => {
    if (!survey || !survey.logic || survey.logic.length === 0) return true;

    for (const rule of survey.logic) {
      if (rule.targetId === qId) {
        const conditionMet = rule.conditions.every((c) => {
          const actualVal = answers[c.questionId];
          if (c.operator === "equals") {
            return String(actualVal).toLowerCase() === String(c.value).toLowerCase();
          }
          if (c.operator === "not-equals") {
            return String(actualVal).toLowerCase() !== String(c.value).toLowerCase();
          }
          if (c.operator === "contains") {
            return String(actualVal).toLowerCase().includes(String(c.value).toLowerCase());
          }
          if (c.operator === "is-answered") {
            return actualVal !== undefined && actualVal !== "" && actualVal !== null;
          }
          return true;
        });

        if (rule.action === "show") {
          return conditionMet;
        } else if (rule.action === "hide") {
          return !conditionMet;
        }
      }
    }

    return true;
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNextSection = () => {
    if (!survey) return;

    // Validate required questions in current section
    const currentSection = survey.sections[currentSectionIdx];
    const visibleQuestions = currentSection.questions.filter((q) => isQuestionVisible(q.id));

    for (const q of visibleQuestions) {
      if (q.required) {
        const val = answers[q.id];
        if (
          val === undefined ||
          val === null ||
          val === "" ||
          (Array.isArray(val) && val.length === 0)
        ) {
          alert(`Please answer required question: "${q.title}"`);
          return;
        }
      }
    }

    if (currentSectionIdx < survey.sections.length - 1) {
      setCurrentSectionIdx((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleSubmit();
    }
  };

  const handlePrevSection = () => {
    if (currentSectionIdx > 0) {
      setCurrentSectionIdx((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    if (!survey) return;
    setIsSubmitting(true);

    try {
      const email =
        respondentUser?.email ||
        answers["respondent_email"] ||
        answers["email"] ||
        answers["q_email"] ||
        "anonymous@kolabasurvey.io";
      const name =
        respondentUser?.name ||
        answers["respondent_name"] ||
        answers["name"] ||
        answers["q_name"] ||
        "Respondent";
      const phone =
        respondentUser?.phone ||
        answers["respondent_phone"] ||
        answers["phone"] ||
        "";
      const college =
        answers["college_name"] ||
        answers["college"] ||
        answers["company"] ||
        "Not Specified";
      const role = answers["role_select"] || answers["role"] || "respondent";

      const res = await fetch("/api/survey/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          survey_id: survey.id,
          respondent_type: role,
          respondent_name: name,
          college: college,
          email: email,
          phone: phone,
          answers: answers,
          survey_path: [survey.title],
          pilot_interest: answers["pilot_interest"] ?? false,
          consent: true,
          time_spent_seconds: 60,
          metadata: {
            surveyTitle: survey.title,
            surveyId: survey.id,
            surveySlug: survey.slug,
            version: survey.version,
          },
        }),
      });

      const data = await res.json();

      if (res.status === 409 || data.alreadySubmitted) {
        setAlreadySubmitted(true);
        return;
      }

      if (data.success) {
        if (typeof window !== "undefined") {
          localStorage.setItem(
            `survey_submitted_${survey.id}_${phone || email}`,
            "true"
          );
        }
        // Navigate in same tab to complete page
        router.push(`/surveys/${survey.slug || survey.id}/complete`);
      } else {
        alert(data.error || "Failed to submit survey. Please try again.");
      }
    } catch (err: any) {
      alert("Submission error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
          <p className="text-xs text-slate-500 font-medium">Preparing survey...</p>
        </div>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Survey Error</h2>
          <p className="text-xs text-slate-600">{error || "Survey not found."}</p>
          <Link
            href="/surveys"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
          >
            <span>Back to Directory</span>
          </Link>
        </div>
      </div>
    );
  }

  // Duplicate submission blocking view
  if (alreadySubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Response Already Recorded</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Our records show that your account ({respondentUser?.email || respondentUser?.phone || "your details"}) has already submitted a response for <strong>{survey.title}</strong>. Multiple submissions are not permitted to ensure study integrity.
          </p>
          <div className="pt-2">
            <Link
              href="/surveys"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0B132B] text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Survey Directory</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const company = survey.company || {
    name: "Kolaba Cloud AI",
    brandPrimaryColor: "#0B132B",
  };
  const brandPrimary = company.brandPrimaryColor || "#0B132B";

  const totalSections = survey.sections.length;
  const currentSection = survey.sections[currentSectionIdx];
  const progressPercent = Math.round(((currentSectionIdx + 1) / totalSections) * 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-32">
      {/* Top Runner Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/surveys/${survey.slug || survey.id}`}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Back to Landing Page"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                {company.name}
              </div>
              <div className="text-sm font-black text-slate-900 truncate max-w-[200px] sm:max-w-md">
                {survey.title}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Section {currentSectionIdx + 1} of {totalSections}
              </div>
              <div className="text-xs font-bold text-slate-700">{progressPercent}% complete</div>
            </div>

            {respondentUser && (
              <div className="px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-700">
                {respondentUser.name.split(" ")[0]}
              </div>
            )}
          </div>
        </div>

        {/* Progress bar line */}
        <div className="w-full bg-slate-100 h-1">
          <div
            className="h-1 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%`, backgroundColor: brandPrimary }}
          />
        </div>
      </header>

      {/* Main Section Questions Card */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
          {/* Section Header */}
          <div className="space-y-2 border-b border-slate-100 pb-5">
            <div className="text-xs font-extrabold uppercase tracking-wider text-teal-700">
              Part {currentSectionIdx + 1} of {totalSections}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {currentSection.title}
            </h1>
            {currentSection.description && (
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {currentSection.description}
              </p>
            )}
          </div>

          {/* Questions Container */}
          <div className="space-y-8">
            {currentSection.questions.map((q, qIdx) => {
              if (!isQuestionVisible(q.id)) return null;

              const val = answers[q.id];

              return (
                <div key={q.id} className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="block text-sm sm:text-base font-bold text-slate-900">
                      <span>{qIdx + 1}. {q.title}</span>
                      {q.required && <span className="text-rose-500 ml-1 font-black">*</span>}
                    </label>
                    {q.description && (
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {q.description}
                      </p>
                    )}
                  </div>

                  {/* Single Choice (Radio) */}
                  {q.type === "single-choice" && (
                    <div className="space-y-2 pt-1">
                      {q.options?.map((opt) => {
                        const optVal = opt.id || opt.label;
                        const isSelected = val === optVal;
                        return (
                          <label
                            key={opt.id}
                            onClick={() => handleAnswerChange(q.id, optVal)}
                            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                                : "border-slate-200 bg-white hover:border-slate-300 text-slate-800"
                            }`}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              checked={isSelected}
                              onChange={() => {}}
                              className="mt-1 sr-only"
                            />
                            <div
                              className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                                isSelected ? "border-white bg-white" : "border-slate-400 bg-white"
                              }`}
                            >
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-slate-900" />
                              )}
                            </div>
                            <div className="space-y-0.5">
                              <div className="text-xs sm:text-sm font-semibold">{opt.label}</div>
                              {opt.sublabel && (
                                <div
                                  className={`text-[11px] ${
                                    isSelected ? "text-slate-300" : "text-slate-500"
                                  }`}
                                >
                                  {opt.sublabel}
                                </div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Multiple Choice (Checkboxes) */}
                  {q.type === "multi-choice" && (
                    <div className="space-y-2 pt-1">
                      {q.options?.map((opt) => {
                        const optVal = opt.id || opt.label;
                        const selectedList: string[] = Array.isArray(val) ? val : [];
                        const isSelected = selectedList.includes(optVal);

                        const toggleSelect = () => {
                          if (isSelected) {
                            handleAnswerChange(
                              q.id,
                              selectedList.filter((item) => item !== optVal)
                            );
                          } else {
                            handleAnswerChange(q.id, [...selectedList, optVal]);
                          }
                        };

                        return (
                          <label
                            key={opt.id}
                            onClick={toggleSelect}
                            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                                : "border-slate-200 bg-white hover:border-slate-300 text-slate-800"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "border-white bg-white text-slate-900"
                                  : "border-slate-400 bg-white"
                              }`}
                            >
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>
                            <div className="space-y-0.5">
                              <div className="text-xs sm:text-sm font-semibold">{opt.label}</div>
                              {opt.sublabel && (
                                <div
                                  className={`text-[11px] ${
                                    isSelected ? "text-slate-300" : "text-slate-500"
                                  }`}
                                >
                                  {opt.sublabel}
                                </div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Short Text */}
                  {q.type === "short-text" && (
                    <input
                      type="text"
                      value={val || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      placeholder={q.placeholder || "Your answer..."}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
                    />
                  )}

                  {/* Long Text */}
                  {q.type === "long-text" && (
                    <textarea
                      rows={4}
                      value={val || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      placeholder={q.placeholder || "Enter details..."}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs resize-y"
                    />
                  )}

                  {/* Yes / No */}
                  {q.type === "yes-no" && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {["Yes", "No"].map((opt) => {
                        const isSelected = val === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleAnswerChange(q.id, opt)}
                            className={`py-3.5 px-4 rounded-xl border font-bold text-xs sm:text-sm transition-all ${
                              isSelected
                                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Rating (1..5 Stars) */}
                  {q.type === "rating" && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <button
                            key={score}
                            type="button"
                            onClick={() => handleAnswerChange(q.id, score)}
                            className={`p-2 rounded-xl border transition-all ${
                              val >= score
                                ? "bg-amber-50 border-amber-300 text-amber-500 scale-105"
                                : "bg-white border-slate-200 text-slate-300 hover:border-slate-300"
                            }`}
                          >
                            <Star className="w-6 h-6 fill-current" />
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-400 max-w-[200px]">
                        <span>{q.minLabel || "1 - Low"}</span>
                        <span>{q.maxLabel || "5 - High"}</span>
                      </div>
                    </div>
                  )}

                  {/* Linear Scale (0..10 or 1..5) */}
                  {q.type === "linear-scale" && (
                    <div className="space-y-2 pt-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        {Array.from(
                          { length: (q.max || 10) - (q.min ?? 0) + 1 },
                          (_, i) => (q.min ?? 0) + i
                        ).map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleAnswerChange(q.id, num)}
                            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl font-bold text-xs sm:text-sm border transition-all ${
                              val === num
                                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-400">
                        <span>{q.minLabel || `${q.min ?? 0} - Not likely`}</span>
                        <span>{q.maxLabel || `${q.max || 10} - Extremely likely`}</span>
                      </div>
                    </div>
                  )}

                  {/* Dropdown */}
                  {q.type === "dropdown" && (
                    <select
                      value={val || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
                    >
                      <option value="">Select an option...</option>
                      {q.options?.map((opt) => (
                        <option key={opt.id} value={opt.id || opt.label}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            {currentSectionIdx > 0 ? (
              <button
                type="button"
                onClick={handlePrevSection}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous Part</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNextSection}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
              style={{ backgroundColor: brandPrimary }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Response...</span>
                </>
              ) : currentSectionIdx === totalSections - 1 ? (
                <>
                  <span>Submit Survey</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Continue to Part {currentSectionIdx + 2}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Respondent Auth Modal (NO OTP, Simple Name & Phone) */}
      <RespondentAuthModal
        isOpen={showAuthModal && !respondentUser}
        onClose={() => setShowAuthModal(false)}
        onAuthenticated={handleAuthenticated}
      />
    </div>
  );
}
