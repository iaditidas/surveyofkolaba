"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cpu, ShieldCheck, ArrowRight, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isSurvey = pathname.startsWith("/survey");

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#0B132B] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
            <Cpu className="w-5 h-5 text-teal-400" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                KOLABA CLOUD AI
              </span>
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            </div>
            <span className="text-[11px] font-medium text-slate-500 tracking-wide uppercase">
              Engineering Colleges Program
            </span>
          </div>
        </Link>

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

          {!isSurvey && (
            <Link
              href="/survey"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-[#0B132B] text-white hover:bg-slate-800 transition-colors shadow-sm"
            >
              <span>Take Survey</span>
              <ArrowRight className="w-4 h-4 text-teal-400" />
            </Link>
          )}

          <Link
            href={isAdmin ? "/admin/dashboard" : "/admin/login"}
            className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg border transition-all ${
              isAdmin
                ? "border-teal-300 bg-teal-50 text-teal-900 font-semibold"
                : "border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-slate-600" />
            <span>{isAdmin ? "Admin Portal" : "Admin Login"}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
