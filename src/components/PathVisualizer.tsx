"use client";

import React from "react";
import { SurveyPathStep } from "@/types/survey";
import { ArrowDown, CheckCircle, HelpCircle, Sparkles } from "lucide-react";

interface PathVisualizerProps {
  surveyPath: SurveyPathStep[];
  respondentTypeLabel: string;
}

export default function PathVisualizer({
  surveyPath,
  respondentTypeLabel,
}: PathVisualizerProps) {
  if (!surveyPath || surveyPath.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
        No survey path trace recorded for this response.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Dynamic Survey Path Flow ({surveyPath.length} Steps)
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-teal-50 text-teal-800 rounded-full border border-teal-200">
          Chained Logic Trace
        </span>
      </div>

      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {surveyPath.map((step, idx) => {
          const isLast = idx === surveyPath.length - 1;

          return (
            <div key={step.questionId || idx} className="relative group">
              {/* Step Node Dot */}
              <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#0B132B] text-white flex items-center justify-center text-[10px] sm:text-xs font-bold ring-4 ring-white shadow-xs">
                {step.stepNumber || idx + 1}
              </div>

              {/* Step Content Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <span className="text-xs font-bold text-teal-700 uppercase tracking-wide">
                    Question {step.stepNumber || idx + 1} ({step.questionId})
                  </span>
                </div>

                <p className="text-sm sm:text-base font-semibold text-slate-900 mb-2.5">
                  {step.questionTitle}
                </p>

                {/* Answer Box */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Selected Answer
                  </div>
                  <div className="text-sm font-medium text-slate-800 break-words">
                    {step.answerSummary || "Not answered"}
                  </div>
                </div>
              </div>

              {/* Connecting arrow if not last */}
              {!isLast && (
                <div className="flex justify-center -mb-2 mt-2">
                  <ArrowDown className="w-4 h-4 text-slate-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
