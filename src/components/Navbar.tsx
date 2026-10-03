"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Cpu, ArrowRight, ShieldCheck, Lock, CheckCircle2, LogOut, Compass } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide on admin and dedicated custom survey runner pages (custom surveys have their own header)
  const isDedicatedCustomSurvey =
    (pathname.startsWith("/surveys/") &&
      !pathname.startsWith("/surveys/engineering-colleges-program")) ||
    pathname.startsWith("/admin");

  const [clickCount, setClickCount] = useState<number>(0);
  const [isSecretTriggered, setIsSecretTriggered] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [respondentUser, setRespondentUser] = useState<any | null>(null);

  useEffect(() => {
    try {
      const stored =
        typeof window !== "undefined"
          ? sessionStorage.getItem("kolaba_respondent_user") ||
            localStorage.getItem("kolaba_respondent_user")
          : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.phone || parsed.name)) {
          setRespondentUser(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, [pathname]);

  if (isDedicatedCustomSurvey) return null;

  const handleRespondentLogout = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("kolaba_respondent_user");
      localStorage.removeItem("kolaba_respondent_user");
      document.cookie = "kolaba_respondent_auth=; path=/; max-age=0;";
    }
    setRespondentUser(null);
    router.push("/");
  };

  // Triple-click trigger on the icon for secret admin access
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Secret Icon Trigger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleIconTripleClick}
            title="Kolaba Cloud AI"
            className={`w-9 h-9 rounded-xl bg-[#0B132B] flex items-center justify-center text-white shadow-xs transition-all duration-200 focus:outline-none cursor-pointer ${
              clickCount > 0 ? "scale-95 ring-2 ring-teal-400" : "hover:scale-105"
            } ${isSecretTriggered ? "ring-4 ring-teal-500 scale-110 rotate-12" : ""}`}
          >
            {isSecretTriggered ? (
              <Lock className="w-4 h-4 text-teal-300 animate-bounce" />
            ) : (
              <Cpu className="w-4 h-4 text-teal-400" />
            )}
          </button>

          <Link href="/" className="flex flex-col group">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg group-hover:text-teal-700 transition-colors">
                KOLABA CLOUD AI
              </span>
              <span className="w-2 h-2 rounded-full bg-teal-500" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Engineering Colleges Program
            </span>
          </Link>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className={`text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              pathname === "/"
                ? "text-slate-900 bg-slate-100 font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Overview
          </Link>

          <Link
            href="/surveys"
            className={`text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              pathname === "/surveys"
                ? "text-slate-900 bg-slate-100 font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-teal-600" />
            <span>All Surveys</span>
          </Link>

          {respondentUser ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                <span className="truncate max-w-[120px]">{respondentUser.name.split(" ")[0]}</span>
              </span>
              <button
                type="button"
                onClick={handleRespondentLogout}
                title="Sign Out Participant"
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : null}

          <Link
            href="/survey"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold px-4 py-2 rounded-xl bg-[#0B132B] text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            <span>Take Survey</span>
            <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
          </Link>
        </div>
      </div>
    </header>
  );
}
