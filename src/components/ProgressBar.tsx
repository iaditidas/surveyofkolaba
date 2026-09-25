"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  roleLabel?: string;
}

export default function ProgressBar({
  currentStep,
  totalSteps,
  roleLabel,
}: ProgressBarProps) {
  const percentage = Math.min(
    100,
    Math.round((Math.max(1, currentStep) / totalSteps) * 100)
  );

  return (
    <div className="w-full bg-white/80 backdrop-blur border-b border-slate-200 py-3 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-medium text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">
              {roleLabel ? `${roleLabel}` : "Kolaba AI Survey"}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-700 font-medium">
              Question {currentStep} of {totalSteps}
            </span>
          </div>
          <span className="font-bold text-teal-700">{percentage}%</span>
        </div>

        {/* Bar */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#0B132B] via-teal-600 to-teal-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
}
