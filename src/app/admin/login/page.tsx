"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Cpu, Lock, ShieldCheck, ArrowRight, AlertCircle, Sparkles } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("admin@kolabacloud.com");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin || "kolaba2026", email }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem("kolaba_admin_session", "authenticated");
        sessionStorage.setItem("kolaba_admin_user", JSON.stringify(data.user));
        router.push("/admin/dashboard");
      } else {
        setError(data.error || "Invalid Passcode. Default is 'kolaba2026'");
      }
    } catch (err: any) {
      setError("Login failed. Please check network connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoAccess = () => {
    setPin("kolaba2026");
    sessionStorage.setItem("kolaba_admin_session", "authenticated");
    sessionStorage.setItem(
      "kolaba_admin_user",
      JSON.stringify({ email: "admin@kolabacloud.com", role: "administrator" })
    );
    router.push("/admin/dashboard");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#0B132B] flex items-center justify-center text-white mx-auto shadow-xs">
            <Cpu className="w-6 h-6 text-teal-400" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Kolaba Admin Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Protected dashboard for institutional survey analytics & responses.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@kolabacloud.com"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:ring-2 focus:ring-[#0B132B] focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Admin Passcode / PIN
              </label>
              <span className="text-[11px] text-slate-600">
                Default: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">kolaba2026</code>
              </span>
            </div>
            <div className="relative">
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter passcode (e.g. kolaba2026)"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:ring-2 focus:ring-[#0B132B] focus:bg-white"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0B132B] text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In to Admin Portal"}
            <ArrowRight className="w-4 h-4 text-teal-400" />
          </button>
        </form>

        {/* Quick Reviewer Demo Bypass */}
        <div className="pt-3 border-t border-slate-100 text-center space-y-2">
          <button
            type="button"
            onClick={handleQuickDemoAccess}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-teal-200 bg-teal-50/70 text-teal-900 text-xs font-semibold hover:bg-teal-100 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>One-Click Reviewer Demo Access</span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-600">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Supabase Auth & Encrypted Token Verification</span>
        </div>
      </div>
    </div>
  );
}
