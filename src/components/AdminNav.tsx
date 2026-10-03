"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Download,
  LogOut,
  Cpu,
  ArrowLeft,
  ListTodo,
  FileBox,
} from "lucide-react";

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    sessionStorage.removeItem("kolaba_admin_session");
    sessionStorage.removeItem("kolaba_admin_user");
    router.push("/admin/login");
  };

  const navItems = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/admin/dashboard",
    },
    {
      label: "Surveys",
      href: "/admin/surveys",
      icon: ListTodo,
      active: pathname === "/admin/surveys" || pathname.startsWith("/admin/surveys/"),
    },
    {
      label: "Templates",
      href: "/admin/templates",
      icon: FileBox,
      active: pathname === "/admin/templates",
    },
    {
      label: "Responses",
      href: "/admin/responses",
      icon: FileText,
      active: pathname === "/admin/responses",
    },
    {
      label: "Analytics & Trends",
      href: "/admin/analytics",
      icon: BarChart3,
      active: pathname === "/admin/analytics",
    },
  ];

  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Badge */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-[#0B132B] flex items-center justify-center text-white">
                <Cpu className="w-4 h-4 text-teal-400" />
              </div>
              <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">
                KOLABA CLOUD AI
              </span>
            </Link>
            <span className="px-2.5 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider">
              Admin Portal
            </span>
          </div>

          {/* Navigation links */}
          <div className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                    item.active
                      ? "bg-[#0B132B] text-white"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}

            {/* Exit to Public Website */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
              title="Exit Admin to Public Website"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Exit to Site</span>
            </Link>

            {/* Direct CSV Export Button */}
            <a
              href="/api/admin/responses?format=csv"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200"
              title="Download CSV"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Export CSV</span>
            </a>

            {/* Logout / Sign Out */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
              title="Sign Out of Admin"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
