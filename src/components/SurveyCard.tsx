"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QuestionDefinition,
  QuestionOption,
  SubQuestion,
} from "@/types/survey";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Info,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Building,
  User,
  Mail,
  Phone as PhoneIcon,
  CheckCircle2,
} from "lucide-react";
import { CONSENT_STATEMENT } from "@/lib/survey-data";

interface SurveyCardProps {
  question: QuestionDefinition;
  currentValue: any;
  allAnswers: Record<string, any>;
  onAnswerChange: (val: any) => void;
  onNext: () => void;
  onBack: () => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  isSubmitting?: boolean;
}

export default function SurveyCard({
  question,
  currentValue,
  allAnswers,
  onAnswerChange,
  onNext,
  onBack,
  isFirstQuestion,
  isLastQuestion,
  isSubmitting = false,
}: SurveyCardProps) {
  const [error, setError] = useState<string | null>(null);

  // Compute dynamic title & subtitle if functions
  const title =
    typeof question.title === "function"
      ? question.title(allAnswers)
      : question.title;

  const subtitle =
    typeof question.subtitle === "function"
      ? question.subtitle(allAnswers)
      : question.subtitle;

  // Clear error on question switch
  useEffect(() => {
    setError(null);
  }, [question.id]);

  // Handle single choice selection
  const handleSingleChoice = (optionId: string) => {
    setError(null);
    onAnswerChange(optionId);
  };

  // Handle multi choice selection
  const handleMultiChoice = (optionId: string, max?: number) => {
    setError(null);
    const existing: string[] = Array.isArray(currentValue) ? [...currentValue] : [];
    const idx = existing.indexOf(optionId);

    if (idx >= 0) {
      existing.splice(idx, 1);
    } else {
      if (max && existing.length >= max) {
        // If at max, remove the first and add the new one or block
        existing.shift();
      }
      existing.push(optionId);
    }
    onAnswerChange(existing);
  };

  // Handle ranking top 3
  const handleRankingToggle = (optionId: string, maxRank = 3) => {
    setError(null);
    const currentList: string[] = Array.isArray(currentValue) ? [...currentValue] : [];
    const idx = currentList.indexOf(optionId);

    if (idx >= 0) {
      // Remove rank
      currentList.splice(idx, 1);
    } else {
      if (currentList.length < maxRank) {
        currentList.push(optionId);
      } else {
        // Replace last item
        currentList[maxRank - 1] = optionId;
      }
    }
    onAnswerChange(currentList);
  };

  // Handle composite subquestions
  const handleSubQuestionChange = (subId: string, val: any) => {
    setError(null);
    const existing = typeof currentValue === "object" && currentValue !== null ? { ...currentValue } : {};
    existing[subId] = val;
    onAnswerChange(existing);
  };

  // Validation before proceed
  const validateAndProceed = () => {
    if (question.type === "single-choice") {
      if (!currentValue) {
        setError("Please select an option to continue");
        return;
      }
    } else if (question.type === "multi-choice") {
      if (!currentValue || (Array.isArray(currentValue) && currentValue.length === 0)) {
        setError("Please select at least one option");
        return;
      }
    } else if (question.type === "ranking") {
      if (!currentValue || !Array.isArray(currentValue) || currentValue.length === 0) {
        setError("Please select your top ranked options");
        return;
      }
    } else if (question.type === "composite") {
      if (!currentValue) {
        setError("Please fill in the required fields");
        return;
      }
      // Check required subquestions
      if (question.subQuestions) {
        for (const sub of question.subQuestions) {
          // If condition applies, check if condition is met
          if (sub.condition && !sub.condition(currentValue)) {
            continue;
          }
          if (sub.required && (!currentValue[sub.id] || currentValue[sub.id] === "")) {
            setError(`Please complete: ${sub.title}`);
            return;
          }
        }
      }
    } else if (question.type === "contact") {
      const contact = currentValue || {};
      if (!contact.contact_name?.trim()) {
        setError("Please enter your name");
        return;
      }
      if (!contact.contact_email?.trim() || !contact.contact_email.includes("@")) {
        setError("Please enter a valid email address");
        return;
      }
      if (contact.consent === false) {
        setError("Please check the consent box to submit your response");
        return;
      }
      if (question.subQuestions) {
        for (const sub of question.subQuestions) {
          if (sub.required && (!contact[sub.id] || (Array.isArray(contact[sub.id]) && contact[sub.id].length === 0))) {
            setError(`Please select an option for: ${sub.title}`);
            return;
          }
        }
      }
    }

    setError(null);
    onNext();
  };

  // Key navigation for single choice options
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          validateAndProceed();
        }
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        validateAndProceed();
      }

      // 1..9 numeric selection for single choice
      if (question.type === "single-choice" && question.options) {
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= question.options.length) {
          e.preventDefault();
          handleSingleChoice(question.options[num - 1].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [question, currentValue, allAnswers]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -14 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="space-y-6"
      >
        {/* Header Tag & Section */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            <span>{question.tag}</span>
          </div>

          <span className="text-xs text-slate-600 font-medium">
            {question.sectionName}
          </span>
        </div>

        {/* Title and Subtitle */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {subtitle}
            </p>
          )}
          {question.helperText && (
            <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 p-2.5 rounded-lg mt-2">
              <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>{question.helperText}</span>
            </div>
          )}
        </div>

        {/* Question Options Body */}
        <div className="pt-2">
          {/* SINGLE CHOICE */}
          {question.type === "single-choice" && question.options && (
            <div className="space-y-2.5">
              {question.options.map((opt, idx) => {
                const isSelected = currentValue === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSingleChoice(opt.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-center justify-between group ${
                      isSelected
                        ? "border-[#0B132B] bg-slate-900 text-white shadow-sm ring-1 ring-[#0B132B]"
                        : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 pr-2">
                      <span
                        className={`w-6 h-6 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors shrink-0 ${
                          isSelected
                            ? "bg-teal-500 text-slate-950 font-bold"
                            : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <div
                          className={`text-sm sm:text-base font-medium ${
                            isSelected ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {opt.label}
                        </div>
                        {opt.sublabel && (
                          <div
                            className={`text-xs mt-0.5 ${
                              isSelected ? "text-slate-300" : "text-slate-500"
                            }`}
                          >
                            {opt.sublabel}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-teal-400 text-slate-950"
                          : "border border-slate-300 group-hover:border-slate-400"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* MULTI CHOICE */}
          {question.type === "multi-choice" && question.options && (
            <div className="space-y-3">
              {question.maxSelections && (
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                  <span>
                    Pick up to {question.maxSelections} options
                  </span>
                  <span className="font-semibold text-teal-700">
                    {Array.isArray(currentValue) ? currentValue.length : 0} of {question.maxSelections} selected
                  </span>
                </div>
              )}
              <div className="space-y-2.5">
                {question.options.map((opt) => {
                  const isSelected =
                    Array.isArray(currentValue) && currentValue.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleMultiChoice(opt.id, question.maxSelections)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-center justify-between group ${
                        isSelected
                          ? "border-[#0B132B] bg-slate-900 text-white shadow-sm ring-1 ring-[#0B132B]"
                          : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs"
                      }`}
                    >
                      <div className="pr-2">
                        <div
                          className={`text-sm sm:text-base font-medium ${
                            isSelected ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {opt.label}
                        </div>
                        {opt.sublabel && (
                          <div
                            className={`text-xs mt-0.5 ${
                              isSelected ? "text-slate-300" : "text-slate-500"
                            }`}
                          >
                            {opt.sublabel}
                          </div>
                        )}
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-teal-400 text-slate-950"
                            : "border border-slate-300 group-hover:border-slate-400"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* RANKING (TOP 3) */}
          {question.type === "ranking" && question.options && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                <span>Click items in order to assign <strong>1st</strong>, <strong>2nd</strong>, and <strong>3rd</strong> ranks</span>
                <span className="font-bold">
                  {Array.isArray(currentValue) ? currentValue.length : 0}/3 ranked
                </span>
              </div>

              <div className="space-y-2.5">
                {question.options.map((opt) => {
                  const rankedIndex = Array.isArray(currentValue)
                    ? currentValue.indexOf(opt.id)
                    : -1;
                  const isRanked = rankedIndex >= 0;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleRankingToggle(opt.id, question.maxSelections || 3)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-center justify-between group ${
                        isRanked
                          ? "border-[#0B132B] bg-slate-900 text-white shadow-sm ring-1 ring-[#0B132B]"
                          : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isRanked ? (
                          <span
                            className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                              rankedIndex === 0
                                ? "bg-amber-400 text-slate-950"
                                : rankedIndex === 1
                                ? "bg-slate-200 text-slate-950"
                                : "bg-orange-300 text-slate-950"
                            }`}
                          >
                            #{rankedIndex + 1}
                          </span>
                        ) : (
                          <span className="w-7 h-7 rounded-lg border border-dashed border-slate-300 text-slate-400 text-xs flex items-center justify-center shrink-0">
                            -
                          </span>
                        )}

                        <span
                          className={`text-sm sm:text-base font-medium ${
                            isRanked ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {opt.label}
                        </span>
                      </div>

                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          isRanked
                            ? "bg-slate-800 text-teal-300 border border-slate-700"
                            : "text-slate-400 group-hover:text-slate-600"
                        }`}
                      >
                        {isRanked ? `Rank #${rankedIndex + 1}` : "Click to rank"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* COMPOSITE SUB-QUESTIONS */}
          {question.type === "composite" && question.subQuestions && (
            <div className="space-y-6">
              {question.subQuestions.map((sub) => {
                // Condition check
                if (sub.condition && !sub.condition(currentValue || {})) {
                  return null;
                }

                const subVal = currentValue?.[sub.id];

                return (
                  <div
                    key={sub.id}
                    className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3"
                  >
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                        {sub.title}
                        {sub.required && <span className="text-teal-600 ml-1">*</span>}
                      </h3>
                      {sub.subtitle && (
                        <p className="text-xs text-slate-500 mt-0.5">{sub.subtitle}</p>
                      )}
                    </div>

                    {/* Text input */}
                    {sub.type === "text" && (
                      <input
                        type="text"
                        value={subVal || ""}
                        onChange={(e) => handleSubQuestionChange(sub.id, e.target.value)}
                        placeholder={sub.placeholder || "Enter details..."}
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0B132B] focus:bg-white transition-all"
                      />
                    )}

                    {/* Scale */}
                    {sub.type === "scale" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-1 sm:gap-2">
                          {[1, 2, 3, 4, 5].map((num) => {
                            const isChosen = Number(subVal) === num;
                            return (
                              <button
                                key={num}
                                type="button"
                                onClick={() => handleSubQuestionChange(sub.id, num)}
                                className={`flex-1 py-3 text-sm sm:text-base font-bold rounded-xl border transition-all ${
                                  isChosen
                                    ? "bg-[#0B132B] text-white border-[#0B132B] shadow-sm"
                                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                                }`}
                              >
                                {num}
                              </button>
                            );
                          })}
                        </div>
                        {sub.scaleLabels && (
                          <div className="flex justify-between text-xs text-slate-500 font-medium px-1">
                            <span>{sub.scaleLabels.min}</span>
                            <span>{sub.scaleLabels.max}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Single choice subquestion */}
                    {sub.type === "single-choice" && sub.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {sub.options.map((opt) => {
                          const isSelected = subVal === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSubQuestionChange(sub.id, opt.id)}
                              className={`p-3 text-left rounded-lg border text-xs sm:text-sm font-medium transition-all ${
                                isSelected
                                  ? "border-[#0B132B] bg-slate-900 text-white font-semibold"
                                  : "border-slate-200 bg-slate-50/80 text-slate-800 hover:bg-slate-100"
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Multi choice subquestion */}
                    {sub.type === "multi-choice" && sub.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {sub.options.map((opt) => {
                          const isSelected =
                            Array.isArray(subVal) && subVal.includes(opt.id);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                const list = Array.isArray(subVal) ? [...subVal] : [];
                                const idx = list.indexOf(opt.id);
                                if (idx >= 0) list.splice(idx, 1);
                                else list.push(opt.id);
                                handleSubQuestionChange(sub.id, list);
                              }}
                              className={`p-3 text-left rounded-lg border text-xs sm:text-sm font-medium flex items-center justify-between transition-all ${
                                isSelected
                                  ? "border-[#0B132B] bg-slate-900 text-white font-semibold"
                                  : "border-slate-200 bg-slate-50/80 text-slate-800 hover:bg-slate-100"
                              }`}
                            >
                              <span>{opt.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* CONTACT & COMMITMENT BLOCK */}
          {question.type === "contact" && (
            <div className="space-y-6">
              {/* Optional subquestions before contact block */}
              {question.subQuestions?.map((sub) => {
                const subVal = currentValue?.[sub.id];
                return (
                  <div
                    key={sub.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2.5"
                  >
                    <label className="text-sm font-semibold text-slate-900">
                      {sub.title}
                    </label>
                    {sub.type === "single-choice" && sub.options && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {sub.options.map((opt) => {
                          const isSelected = subVal === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSubQuestionChange(sub.id, opt.id)}
                              className={`p-2.5 text-center text-xs sm:text-sm rounded-lg border font-medium transition-all ${
                                isSelected
                                  ? "bg-slate-900 text-white border-[#0B132B]"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {sub.type === "multi-choice" && sub.options && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {sub.options.map((opt) => {
                          const isSelected =
                            Array.isArray(subVal) && subVal.includes(opt.id);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                const list = Array.isArray(subVal) ? [...subVal] : [];
                                const idx = list.indexOf(opt.id);
                                if (idx >= 0) list.splice(idx, 1);
                                else list.push(opt.id);
                                handleSubQuestionChange(sub.id, list);
                              }}
                              className={`p-2.5 text-center text-xs rounded-lg border font-medium flex items-center justify-center gap-1.5 transition-all ${
                                isSelected
                                  ? "bg-slate-900 text-white border-[#0B132B]"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              <span>{opt.label}</span>
                              {isSelected && <Check className="w-3 h-3 text-teal-400" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Contact Information Form */}
              <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <User className="w-4 h-4 text-teal-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Contact & Collaboration Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Full Name <span className="text-teal-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={currentValue?.contact_name || ""}
                      onChange={(e) => handleSubQuestionChange("contact_name", e.target.value)}
                      placeholder="e.g. Dr. Rajesh Kumar / Sneha Patel"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 focus:ring-2 focus:ring-[#0B132B] focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      College / Institution Name
                    </label>
                    <input
                      type="text"
                      value={currentValue?.contact_college || allAnswers["B1"]?.college_name || allAnswers["C1"]?.college_name || allAnswers["A1"]?.college_details || ""}
                      onChange={(e) => handleSubQuestionChange("contact_college", e.target.value)}
                      placeholder="e.g. RV College of Engineering"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 focus:ring-2 focus:ring-[#0B132B] focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Email Address <span className="text-teal-600">*</span>
                    </label>
                    <input
                      type="email"
                      value={currentValue?.contact_email || ""}
                      onChange={(e) => handleSubQuestionChange("contact_email", e.target.value)}
                      placeholder="name@college.edu.in"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 focus:ring-2 focus:ring-[#0B132B] focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Phone Number / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={currentValue?.contact_phone || ""}
                      onChange={(e) => handleSubQuestionChange("contact_phone", e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 focus:ring-2 focus:ring-[#0B132B] focus:bg-white"
                    />
                  </div>
                </div>

                {/* Consent Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 p-3 rounded-lg bg-teal-50/70 border border-teal-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentValue?.consent !== false}
                      onChange={(e) => handleSubQuestionChange("consent", e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span className="text-xs text-slate-700 leading-relaxed font-medium">
                      {CONSENT_STATEMENT}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Validation Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Action Buttons */}
        <div className="pt-4 flex items-center justify-between border-t border-slate-100">
          <button
            type="button"
            onClick={onBack}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors ${
              isFirstQuestion ? "opacity-70" : ""
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-slate-500 font-medium">
              Press <strong>Enter ↵</strong>
            </span>
            <button
              type="button"
              onClick={validateAndProceed}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0B132B] text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : isLastQuestion ? (
                <>
                  <span>Submit Survey</span>
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4 text-teal-400" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
