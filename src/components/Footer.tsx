"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cpu, Mail, Globe, ShieldCheck, Compass, Lock } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on admin pages and dedicated survey runners
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/surveys/") ||
    pathname.startsWith("/survey/")
  ) {
    return null;
  }

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0B132B] flex items-center justify-center text-white">
                <Cpu className="w-4 h-4 text-teal-400" />
              </div>
              <span className="font-extrabold text-slate-900 tracking-tight">
                KOLABA SURVEYS
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md leading-relaxed">
              Enterprise multi-survey platform powering verified academic studies, customer sentiment, product telemetry, and institutional research with strict survey-level data isolation.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Isolated database schema &amp; encrypted responses</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Platform Navigation
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-600">
              <li>
                <Link href="/surveys" className="hover:text-teal-700 transition-colors flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-slate-400" />
                  <span>Available Surveys</span>
                </Link>
              </li>
              <li>
                <Link href="/surveys/engineering-colleges-program" className="hover:text-teal-700 transition-colors">
                  Engineering Colleges Program
                </Link>
              </li>
              <li>
                <Link href="/surveys/customer-feedback-survey" className="hover:text-teal-700 transition-colors">
                  Customer Experience Survey
                </Link>
              </li>
            </ul>
          </div>

          {/* Administration & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Administration
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-600">
              <li>
                <Link href="/admin/login" className="hover:text-teal-700 transition-colors flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Admin Dashboard</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/surveys/create" className="hover:text-teal-700 transition-colors">
                  Create New Survey
                </Link>
              </li>
              <li>
                <a
                  href="https://kolabacloud.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-teal-700 transition-colors flex items-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>Kolaba Cloud</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <div>
            &copy; {new Date().getFullYear()} Kolaba Surveys Platform. All rights reserved.
          </div>
          <div>
            Strict multi-survey data partitioning. Responses are never cross-pollinated.
          </div>
        </div>
      </div>
    </footer>
  );
}
