"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Cpu,
  Loader2,
  AlertCircle,
  Star,
} from "lucide-react";
import { SurveySchema, SurveyQuestion, LogicRule } from "@/types/schema";
import RespondentAuthModal, { RespondentUser } from "@/components/RespondentAuthModal";

export default function UniversalSurveyRunner({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [survey, setSurvey] = useState<SurveySchema | null>(null);

  const [respondentUser, setRespondentUser] = useState<RespondentUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState<boolean>(false);

  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
        if (parsed && (parsed.phone || parsed.email)) {
          setRespondentUser(parsed);
          setShowAuthModal(false);
          prefillRespondentAnswers(parsed);
          checkDuplicateSubmission(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, [id]);

  const checkDuplicateSubmission = async (user: RespondentUser) => {
    if (typeof window !== "undefined") {
      const localFlag = localStorage.getItem(`kolaba_submitted_${id}_${user.phone || user.email}`);
      if (localFlag) {
        setAlreadySubmitted(true);
        return;
      }
    }

    try {
      const query = new URLSearchParams({
        surveyId: id,
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
  }, [id]);

  const fetchSurvey = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/surveys/${id}`);
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
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
          alert(`Please answer: "${q.title}"`);
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
      // Find identity fields if present
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
      const role = answers["role_select"] || answers["role"] || "general";

      const res = await fetch("/api/survey/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          survey_id: survey.id,
          respondent_type: role.toLowerCase().includes("student")
            ? "student"
            : role.toLowerCase().includes("faculty")
            ? "faculty"
            : role.toLowerCase().includes("tpo")
            ? "tpo"
            : "admin",
          respondent_name: name,
          college: college,
          email: email,
          phone: phone,
          answers: answers,
          survey_path: [survey.title],
          pilot_interest: answers["pilot_interest"] || false,
          consent: true,
          time_spent_seconds: 60,
          metadata: {
            surveyTitle: survey.title,
            surveyId: survey.id,
            version: survey.version,
          },
        }),
      });

      const data = await res.json();

      if (res.status === 409 || data.alreadySubmitted) {
        setAlreadySubmitted(true);
        if (typeof window !== "undefined") {
          localStorage.setItem(`kolaba_submitted_${id}_${phone || email}`, "true");
        }
        return;
      }

      if (res.ok) {
        if (typeof window !== "undefined") {
          localStorage.setItem(`kolaba_submitted_${id}_${phone || email}`, "true");
        }
        setIsSubmitted(true);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        alert(data.error || "Failed to record response. Please try again.");
      }
    } catch (err: any) {
      alert("Submission error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <span className="text-sm font-medium">Loading survey...</span>
        </div>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Survey Not Found</h2>
          <p className="text-sm text-slate-500">{error || "This survey link may be invalid or expired."}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B132B] text-white text-sm font-bold hover:bg-slate-800 transition-colors"
          >
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  // Duplicate submission blocked screen
  if (alreadySubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-md"
        >
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Response Already Recorded</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Our records show that you have already submitted your response for this survey using{" "}
              <strong className="text-slate-900 font-semibold">{respondentUser?.email || respondentUser?.phone || "this account"}</strong>.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              To maintain statistical research integrity and prevent duplicate responses, each participant may submit only once. Thank you!
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0B132B] text-white text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm"
            >
              <span>Return to Home</span>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-md"
        >
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Response Recorded</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {survey.settings?.completionMessage ||
                "Thank you for sharing your valuable perspectives. Your input directly influences future research and initiative roadmaps."}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0B132B] text-white text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm"
            >
              <span>Done</span>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Gate survey with Respondent Authentication
  if (showAuthModal && !respondentUser) {
    return (
      <RespondentAuthModal
        onAuthenticated={handleAuthenticated}
        surveyTitle={survey.title}
      />
    );
  }

  const currentSection = survey.sections[currentSectionIdx];
  const progressPercent = Math.round(((currentSectionIdx + 1) / survey.sections.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/70 text-slate-900 flex flex-col justify-between">
      {/* Brand header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0B132B] text-white flex items-center justify-center">
              <Cpu className="w-4 h-4 text-teal-400" />
            </div>
            <span className="font-bold text-slate-900 text-sm tracking-tight">KOLABA CLOUD AI</span>
          </Link>

          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {survey.industry || "Research"}
          </span>
        </div>

        {/* Progress bar */}
        {survey.settings?.showProgressIndicator !== false && (
          <div className="w-full bg-slate-200 h-1">
            <div
              className="bg-teal-600 h-1 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </header>

      {/* Main survey body */}
      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-8"
          >
            {/* Section intro header */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-teal-600 uppercase tracking-wider flex items-center gap-2">
                <span>
                  Section {currentSectionIdx + 1} of {survey.sections.length}
                </span>
                <span>&bull;</span>
                <span>{progressPercent}% Complete</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {currentSection.title}
              </h1>
              {currentSection.description && (
                <p className="text-sm text-slate-600 leading-relaxed">
                  {currentSection.description}
                </p>
              )}
            </div>

            {/* Questions container */}
            <div className="space-y-6">
              {currentSection.questions
                .filter((q) => isQuestionVisible(q.id))
                .map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {survey.settings?.showQuestionNumbers !== false && (
                          <span className="text-xs font-bold text-slate-400 font-mono">
                            {idx + 1}.
                          </span>
                        )}
                        <h3 className="font-bold text-slate-900 text-base">
                          {q.title}
                          {q.required && <span className="text-teal-600 ml-1">*</span>}
                        </h3>
                      </div>
                      {q.description && (
                        <p className="text-xs text-slate-500 mt-1 pl-4">{q.description}</p>
                      )}
                    </div>

                    {/* Question Input Types */}
                    <div className="pt-2">
                      {/* Short Text */}
                      {q.type === "short-text" && (
                        <input
                          type="text"
                          value={answers[q.id] || ""}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          placeholder={q.placeholder || "Type your answer..."}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                        />
                      )}

                      {/* Long Text */}
                      {q.type === "long-text" && (
                        <textarea
                          rows={4}
                          value={answers[q.id] || ""}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          placeholder={q.placeholder || "Share your feedback in detail..."}
                          className="w-full p-4 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all leading-relaxed"
                        />
                      )}

                      {/* Email */}
                      {q.type === "email" && (
                        <input
                          type="email"
                          value={answers[q.id] || ""}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          placeholder={q.placeholder || "name@organization.com"}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                        />
                      )}

                      {/* Phone */}
                      {q.type === "phone" && (
                        <input
                          type="tel"
                          value={answers[q.id] || ""}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          placeholder={q.placeholder || "+91 98765 43210"}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                        />
                      )}

                      {/* Single Choice (Radio) */}
                      {q.type === "single-choice" && (
                        <div className="space-y-2">
                          {q.options?.map((opt) => {
                            const selected = answers[q.id] === opt.label || answers[q.id] === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleAnswerChange(q.id, opt.label)}
                                className={`w-full p-3.5 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between ${
                                  selected
                                    ? "border-teal-600 bg-teal-50 text-teal-900 ring-1 ring-teal-600"
                                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-800"
                                }`}
                              >
                                <span>{opt.label}</span>
                                {selected && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Multi Choice (Checkboxes) */}
                      {q.type === "multi-choice" && (
                        <div className="space-y-2">
                          {q.options?.map((opt) => {
                            const cur = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                            const isChecked = cur.includes(opt.label);
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  if (isChecked) {
                                    handleAnswerChange(
                                      q.id,
                                      cur.filter((x: string) => x !== opt.label)
                                    );
                                  } else {
                                    handleAnswerChange(q.id, [...cur, opt.label]);
                                  }
                                }}
                                className={`w-full p-3.5 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between ${
                                  isChecked
                                    ? "border-teal-600 bg-teal-50 text-teal-900 ring-1 ring-teal-600"
                                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-800"
                                }`}
                              >
                                <span>{opt.label}</span>
                                {isChecked && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Dropdown */}
                      {q.type === "dropdown" && (
                        <select
                          value={answers[q.id] || ""}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium text-slate-800"
                        >
                          <option value="">-- Please select an option --</option>
                          {q.options?.map((opt) => (
                            <option key={opt.id} value={opt.label}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Yes / No */}
                      {q.type === "yes-no" && (
                        <div className="grid grid-cols-2 gap-3">
                          {["Yes", "No"].map((choice) => {
                            const selected = answers[q.id] === choice;
                            return (
                              <button
                                key={choice}
                                type="button"
                                onClick={() => handleAnswerChange(q.id, choice)}
                                className={`py-3.5 rounded-xl border text-center text-sm font-bold transition-all ${
                                  selected
                                    ? "border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-600"
                                    : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                                }`}
                              >
                                {choice}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Rating (1 to 5) */}
                      {q.type === "rating" && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 justify-center sm:justify-start">
                            {[1, 2, 3, 4, 5].map((star) => {
                              const active = (answers[q.id] || 0) >= star;
                              return (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => handleAnswerChange(q.id, star)}
                                  className={`w-12 h-12 rounded-xl border flex items-center justify-center text-base font-bold transition-all ${
                                    active
                                      ? "bg-amber-400 border-amber-500 text-white shadow-sm scale-105"
                                      : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                                  }`}
                                >
                                  <Star className={`w-5 h-5 ${active ? "fill-white" : ""}`} />
                                </button>
                              );
                            })}
                          </div>
                          {(q.minLabel || q.maxLabel) && (
                            <div className="flex justify-between text-xs text-slate-500 pt-1">
                              <span>{q.minLabel || "1"}</span>
                              <span>{q.maxLabel || "5"}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Linear Scale (0 to 10) */}
                      {q.type === "linear-scale" && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                            {Array.from({ length: 11 }, (_, i) => i).map((num) => {
                              const selected = answers[q.id] === num;
                              return (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() => handleAnswerChange(q.id, num)}
                                  className={`w-10 h-10 rounded-xl border text-xs font-bold shrink-0 transition-all ${
                                    selected
                                      ? "bg-[#0B132B] border-[#0B132B] text-white shadow-sm"
                                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                  }`}
                                >
                                  {num}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>{q.minLabel || "0 - Not Likely"}</span>
                            <span>{q.maxLabel || "10 - Extremely Likely"}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {/* Navigation Buttons */}
            <div className="pt-4 flex items-center justify-between">
              {currentSectionIdx > 0 ? (
                <button
                  type="button"
                  onClick={handlePrevSection}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={handleNextSection}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#0B132B] text-white text-sm font-bold hover:bg-slate-800 transition-all shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                    <span>Submitting...</span>
                  </>
                ) : currentSectionIdx < survey.sections.length - 1 ? (
                  <>
                    <span>Next Section</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Submit Response</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/80 text-center text-xs text-slate-500">
        Powered by <span className="font-semibold text-slate-700">Kolaba Cloud AI</span> &bull; Sovereign & Secure
      </footer>
    </div>
  );
}
