"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ProgressBar from "./ProgressBar";
import SurveyCard from "./SurveyCard";
import ThankYouScreen from "./ThankYouScreen";
import {
  RespondentType,
  QuestionDefinition,
  SurveyPathStep,
  QuestionOption,
} from "@/types/survey";
import {
  PERSONA_GATE_QUESTION,
  FLOWS_BY_PERSONA,
  PERSONA_INFO,
} from "@/lib/survey-data";
import { Cpu, Users, Award, ShieldAlert, Sparkles } from "lucide-react";

export default function SurveyEngine() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") as RespondentType | null;

  const [respondentType, setRespondentType] = useState<RespondentType | null>(
    initialRole && FLOWS_BY_PERSONA[initialRole] ? initialRole : null
  );

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [history, setHistory] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedResponse, setCompletedResponse] = useState<{
    id: string;
    type: RespondentType;
    name: string;
    college: string;
    pilotInterest: any;
  } | null>(null);

  const [startTime] = useState<number>(() => Date.now());

  // Determine current active flow questions
  const activeQuestions: QuestionDefinition[] = respondentType
    ? FLOWS_BY_PERSONA[respondentType]
    : [];

  const currentQuestion: QuestionDefinition | null =
    respondentType === null
      ? PERSONA_GATE_QUESTION
      : activeQuestions[currentQuestionIndex] || null;

  // Handle answers update
  const handleAnswerChange = (val: any) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: val,
    }));
  };

  // Helper to build a readable summary for a question's answer
  const getAnswerSummary = (q: QuestionDefinition, ans: any): string => {
    if (ans === undefined || ans === null) return "N/A";
    if (typeof ans === "string") return ans;
    if (typeof ans === "number") return String(ans);
    if (Array.isArray(ans)) return ans.join(", ");
    if (typeof ans === "object") {
      const parts = Object.entries(ans)
        .filter(([k, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => {
          if (Array.isArray(v)) return `${v.join(", ")}`;
          return `${v}`;
        });
      return parts.join(" | ");
    }
    return String(ans);
  };

  // Navigation: Next / Branching
  const handleNext = async () => {
    // 1. If at Gate step, select persona flow
    if (respondentType === null) {
      const selectedPersona = answers["gate"] as RespondentType;
      if (!selectedPersona || !FLOWS_BY_PERSONA[selectedPersona]) {
        return;
      }
      setRespondentType(selectedPersona);
      setCurrentQuestionIndex(0);
      setHistory(["gate"]);
      return;
    }

    if (!currentQuestion) return;

    // Check if Last Question (Step 10 / Final question)
    const isLast = currentQuestionIndex === activeQuestions.length - 1;

    if (isLast) {
      // SUBMIT THE SURVEY
      await submitSurvey();
      return;
    }

    // Determine Next Question using custom branching logic
    const currentAns = answers[currentQuestion.id];
    let nextQuestionId: string | null = null;

    if (currentQuestion.getNextQuestionId) {
      nextQuestionId = currentQuestion.getNextQuestionId(currentAns, answers);
    }

    // Record in history for Back navigation
    setHistory((prev) => [...prev, currentQuestion.id]);

    if (nextQuestionId) {
      const nextIdx = activeQuestions.findIndex((q) => q.id === nextQuestionId);
      if (nextIdx >= 0) {
        setCurrentQuestionIndex(nextIdx);
        return;
      }
    }

    // Default sequential progression
    setCurrentQuestionIndex((prev) => prev + 1);
  };

  // Navigation: Back
  const handleBack = () => {
    if (history.length === 0) {
      if (respondentType !== null) {
        setRespondentType(null);
        setCurrentQuestionIndex(0);
      }
      return;
    }

    const previousQuestionId = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

    if (previousQuestionId === "gate") {
      setRespondentType(null);
      setCurrentQuestionIndex(0);
      return;
    }

    const prevIdx = activeQuestions.findIndex((q) => q.id === previousQuestionId);
    if (prevIdx >= 0) {
      setCurrentQuestionIndex(prevIdx);
    } else {
      setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
    }
  };

  // Submit survey payload to API
  const submitSurvey = async () => {
    if (!respondentType || !currentQuestion) return;

    setIsSubmitting(true);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    // Build the completed survey path trace
    const allVisitedIds = [...history.filter((id) => id !== "gate"), currentQuestion.id];
    const surveyPath: SurveyPathStep[] = allVisitedIds
      .map((qId) => {
        const qDef = activeQuestions.find((q) => q.id === qId);
        if (!qDef) return null;
        const ans = answers[qId];
        const title =
          typeof qDef.title === "function" ? qDef.title(answers) : qDef.title;

        return {
          questionId: qDef.id,
          stepNumber: qDef.stepNumber,
          questionTitle: title,
          answerSummary: getAnswerSummary(qDef, ans),
          rawAnswer: ans,
        };
      })
      .filter(Boolean) as SurveyPathStep[];

    // Extract contact details based on role
    const lastAns = answers[currentQuestion.id] || {};
    let respondentName = lastAns.contact_name || "Anonymous Respondent";
    let email = lastAns.contact_email || "";
    let phone = lastAns.contact_phone || "";
    let college =
      lastAns.contact_college ||
      answers["B1"]?.college_name ||
      answers["C1"]?.college_name ||
      answers["A1"]?.college_details ||
      "";
    let department =
      answers["D1"] ||
      answers["B1"]?.department ||
      answers["A1"]?.branches_offered?.join(", ") ||
      "";
    let role =
      answers["B1"]?.role ||
      lastAns.contact_designation ||
      PERSONA_INFO[respondentType]?.label ||
      "";

    let pilotInterest =
      lastAns.pilot_interest ||
      lastAns.pilot_welcome ||
      lastAns.tpo_pilot_interest ||
      lastAns.campus_ambassador ||
      false;

    const payload = {
      respondent_type: respondentType,
      respondent_name: respondentName,
      college: college,
      department: department,
      role: role,
      email: email,
      phone: phone,
      answers: answers,
      survey_path: surveyPath,
      pilot_interest: pilotInterest,
      consent: lastAns.consent !== false,
      time_spent_seconds: timeSpent,
    };

    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCompletedResponse({
          id: data.id,
          type: respondentType,
          name: respondentName,
          college: college,
          pilotInterest: pilotInterest,
        });
      } else {
        alert(data.error || "Something went wrong submitting your survey. Please try again.");
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      alert("Network error: Unable to submit survey. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSurvey = () => {
    setRespondentType(null);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setHistory([]);
    setCompletedResponse(null);
  };

  // If completed, show celebratory screen
  if (completedResponse) {
    return (
      <ThankYouScreen
        respondentType={completedResponse.type}
        submissionId={completedResponse.id}
        name={completedResponse.name}
        college={completedResponse.college}
        pilotInterest={completedResponse.pilotInterest}
        onReset={handleResetSurvey}
      />
    );
  }

  return (
    <div className="min-h-[85vh] flex flex-col justify-start">
      {/* Dynamic Progress Bar */}
      {respondentType !== null && (
        <ProgressBar
          currentStep={currentQuestionIndex + 1}
          totalSteps={activeQuestions.length || 10}
          roleLabel={PERSONA_INFO[respondentType]?.badge || "Kolaba Survey"}
        />
      )}

      {/* Main Question View */}
      {currentQuestion && (
        <SurveyCard
          question={currentQuestion}
          currentValue={answers[currentQuestion.id]}
          allAnswers={answers}
          onAnswerChange={handleAnswerChange}
          onNext={handleNext}
          onBack={handleBack}
          isFirstQuestion={respondentType === null || currentQuestionIndex === 0}
          isLastQuestion={
            respondentType !== null &&
            currentQuestionIndex === activeQuestions.length - 1
          }
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
