"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Cpu, ArrowRight, ShieldCheck, Lock } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isSurvey = pathname.startsWith("/survey");
  const isAdmin = pathname.startsWith("/admin");

  const [clickCount, setClickCount] = useState<number>(0);
  const [isSecretTriggered, setIsSecretTriggered] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Triple-click trigger on the Kolaba icon
  const handleIconTripleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const nextCount = clickCount + 1;
    setClickCount(nextCount);

    if (nextCount >= 3) {
      setIsSecretTriggered(true);
      setClickCount(0);
      setTimeout(() => {
        setIsSecretTriggered(false);
        const session =
          typeof window !== "undefined"
            ? sessionStorage.getItem("kolaba_admin_session")
            : null;
        if (session) {
          router.push("/admin/dashboard");
        } else {
          router.push("/admin/login");
        }
      }, 300);
    } else {
      timerRef.current = setTimeout(() => {
        setClickCount(0);
      }, 1200);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Secret Icon Trigger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleIconTripleClick}
            title="Kolaba Cloud AI"
            className={`w-10 h-10 rounded-xl bg-[#0B132B] flex items-center justify-center text-white shadow-sm transition-all duration-200 focus:outline-none cursor-pointer ${
              clickCount > 0 ? "scale-95 ring-2 ring-teal-400" : "hover:scale-105"
            } ${isSecretTriggered ? "ring-4 ring-teal-500 scale-110 rotate-12" : ""}`}
          >
            {isSecretTriggered ? (
              <Lock className="w-5 h-5 text-teal-300 animate-bounce" />
            ) : (
              <Cpu className="w-5 h-5 text-teal-400" />
            )}
          </button>

          <Link href="/" className="flex flex-col group">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg group-hover:text-teal-700 transition-colors">
                KOLABA CLOUD AI
              </span>
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            </div>
            <span className="text-[11px] font-medium text-slate-500 tracking-wide uppercase">
              Engineering Colleges Program
            </span>
          </Link>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              pathname === "/"
                ? "text-slate-900 bg-slate-100"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Overview
          </Link>

          {!isSurvey ? (
            <Link
              href="/survey"
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-[#0B132B] text-white hover:bg-slate-800 transition-colors shadow-sm"
            >
              <span>Take Survey</span>
              <ArrowRight className="w-4 h-4 text-teal-400" />
            </Link>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Responses Sent via Email</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
