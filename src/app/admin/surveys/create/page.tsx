"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AdminNav from "@/components/AdminNav";
import {
  Sparkles,
  Building2,
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  Plus,
  Loader2,
  Globe,
  Mail,
  MapPin,
  Palette,
  Layers,
  HelpCircle,
  Save,
  Check,
  Cpu,
} from "lucide-react";
import { SurveySchema, CompanyProfile, QuestionType } from "@/types/schema";

export default function CreateSurveyPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Company Profile Info
  const [companyName, setCompanyName] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [industry, setIndustry] = useState("AI / Data / Technology");
  const [companyDescription, setCompanyDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [tagline, setTagline] = useState("");
  const [primaryContactName, setPrimaryContactName] = useState("");
  const [primaryContactEmail, setPrimaryContactEmail] = useState("");
  const [location, setLocation] = useState("");
  const [brandPrimaryColor, setBrandPrimaryColor] = useState("#0B132B");
  const [brandSecondaryColor, setBrandSecondaryColor] = useState("#0D9488");

  // Step 2: Survey Core Details
  const [surveyName, setSurveyName] = useState("");
  const [surveyDescription, setSurveyDescription] = useState("");
  const [surveyPurpose, setSurveyPurpose] = useState("");
  const [estMinutes, setEstMinutes] = useState(4);

  // Step 3: Creation Mode
  const [mode, setMode] = useState<"ai" | "document" | "scratch">("ai");
  const [prompt, setPrompt] = useState("");
  const [documentText, setDocumentText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Generated/Draft Survey Structure
  const [sections, setSections] = useState<any[]>([
    {
      id: `sec_1`,
      title: "1. Background & Profile",
      description: "Basic respondent context and primary track.",
      order: 1,
      visibility: "VISIBLE",
      questions: [
        {
          id: `q_role_select`,
          type: "single-choice" as QuestionType,
          title: "Which best describes your primary role?",
          required: true,
          order: 1,
          visibility: "VISIBLE",
          options: [
            { id: "lead", label: "Team Lead / Practitioner" },
            { id: "member", label: "Individual Contributor / Student" },
            { id: "director", label: "Executive / Academic Leadership" },
          ],
        },
      ],
    },
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [createdSurvey, setCreatedSurvey] = useState<SurveySchema | null>(null);

  useEffect(() => {
    const session = sessionStorage.getItem("kolaba_admin_session");
    if (!session) {
      router.push("/admin/login");
      return;
    }
    setAuthenticated(true);
  }, [router]);

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    );
  }

  // Handle AI generation
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/surveys/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          prompt: mode === "ai" ? prompt || surveyName : undefined,
          rawDocumentText: mode === "document" ? documentText : undefined,
          industry,
          companyName,
          surveyPurpose,
        }),
      });

      const data = await res.json();
      if (data.success && data.survey?.sections) {
        setSections(data.survey.sections);
        setStep(4);
      } else {
        // Fallback default sections if generator encounters an issue
        alert(data.error || "Generation complete. Reviewing generated draft.");
        setStep(4);
      }
    } catch (err: any) {
      alert("Notice: " + err.message);
      setStep(4);
    } finally {
      setIsGenerating(false);
    }
  };

  // Final Save to Supabase
  const handleSaveSurvey = async (publishImmediate = false) => {
    if (!companyName.trim()) {
      alert("Please provide a Company or Organization name.");
      setStep(1);
      return;
    }
    if (!surveyName.trim()) {
      alert("Please provide a Survey Name.");
      setStep(2);
      return;
    }

    setIsSaving(true);
    try {
      const slug =
        surveyName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "") +
        "-" +
        Date.now().toString().slice(-4);

      const companyPayload: CompanyProfile = {
        name: companyName,
        logoUrl: companyLogoUrl || undefined,
        industry: industry,
        description: companyDescription || undefined,
        website: website || undefined,
        tagline: tagline || undefined,
        primaryContactName: primaryContactName || undefined,
        primaryContactEmail: primaryContactEmail || undefined,
        location: location || undefined,
        brandPrimaryColor: brandPrimaryColor || "#0B132B",
        brandSecondaryColor: brandSecondaryColor || "#0D9488",
      };

      const payload: Partial<SurveySchema> = {
        id: `surv_${Date.now()}`,
        slug: slug,
        title: surveyName,
        description: surveyDescription || `Survey by ${companyName}`,
        purpose: surveyPurpose || undefined,
        industry: industry,
        status: publishImmediate ? "PUBLISHED" : "DRAFT",
        version: 1,
        company: companyPayload,
        sections: sections,
        logic: [],
        settings: {
          allowMultipleResponses: false,
          isAnonymous: false,
          requireEmail: true,
          showProgressIndicator: true,
          showQuestionNumbers: true,
          brandColor: brandPrimaryColor,
          estCompletionMinutes: Number(estMinutes) || 4,
          completionMessage: `Thank you for completing the ${surveyName}. Your feedback has been securely received by ${companyName}.`,
        },
      };

      const res = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.survey) {
        setCreatedSurvey(data.survey);
      } else {
        alert(data.error || "Failed to save survey.");
      }
    } catch (err: any) {
      alert("Save error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      <AdminNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/surveys"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Surveys</span>
          </Link>

          {/* Stepper Progress */}
          <div className="flex items-center gap-2">
            {[
              { num: 1, label: "Company" },
              { num: 2, label: "Survey" },
              { num: 3, label: "Content" },
              { num: 4, label: "Review" },
            ].map((s) => (
              <div key={s.num} className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => s.num < step && setStep(s.num as any)}
                  className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center transition-all ${
                    step === s.num
                      ? "bg-[#0B132B] text-white shadow-xs"
                      : step > s.num
                      ? "bg-teal-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
                </button>
                <span
                  className={`text-xs font-bold hidden sm:inline ${
                    step === s.num ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {s.label}
                </span>
                {s.num < 4 && <div className="w-4 h-0.5 bg-slate-200" />}
              </div>
            ))}
          </div>
        </div>

        {/* STEP 1: Company / Organization Information */}
        {step === 1 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
            <div className="space-y-1 border-b border-slate-100 pb-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700">
                Step 1 of 4: Organization Context
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Company &amp; Organization Information
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                This information dynamically styles the survey landing page, header branding, and response notifications.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Company / Organization Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Kolaba Cloud or Apex Healthcare"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Industry / Domain <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. AI / Data / Technology"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Company Logo URL (Optional)
                </label>
                <input
                  type="url"
                  value={companyLogoUrl}
                  onChange={(e) => setCompanyLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Tagline / Motto
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. High-performance sovereign AI infrastructure"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Company Description
                </label>
                <textarea
                  rows={3}
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Brief summary of what your organization does..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Website URL
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://kolabacloud.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Location / Headquarters
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bengaluru, India"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Primary Contact Name
                </label>
                <input
                  type="text"
                  value={primaryContactName}
                  onChange={(e) => setPrimaryContactName(e.target.value)}
                  placeholder="e.g. Program Lead"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Primary Contact Email
                </label>
                <input
                  type="email"
                  value={primaryContactEmail}
                  onChange={(e) => setPrimaryContactEmail(e.target.value)}
                  placeholder="lead@organization.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Brand Colors */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-slate-500" />
                  <span>Primary Brand Color</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandPrimaryColor}
                    onChange={(e) => setBrandPrimaryColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={brandPrimaryColor}
                    onChange={(e) => setBrandPrimaryColor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-slate-500" />
                  <span>Secondary Brand Color</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandSecondaryColor}
                    onChange={(e) => setBrandSecondaryColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={brandSecondaryColor}
                    onChange={(e) => setBrandSecondaryColor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!companyName.trim()) {
                    alert("Please enter the Company / Organization name.");
                    return;
                  }
                  setStep(2);
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0B132B] hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
              >
                <span>Continue to Survey Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Survey Core Details */}
        {step === 2 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
            <div className="space-y-1 border-b border-slate-100 pb-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700">
                Step 2 of 4: Survey Definition
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Survey Name &amp; Purpose
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Define the title, core objectives, and respondent expectations.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Survey Name / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={surveyName}
                  onChange={(e) => setSurveyName(e.target.value)}
                  placeholder="e.g. Engineering Colleges Program or Hospital Staff Feedback"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Survey Description
                </label>
                <textarea
                  rows={3}
                  value={surveyDescription}
                  onChange={(e) => setSurveyDescription(e.target.value)}
                  placeholder="A clear description displayed to respondents on the landing page..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Survey Purpose
                </label>
                <textarea
                  rows={2}
                  value={surveyPurpose}
                  onChange={(e) => setSurveyPurpose(e.target.value)}
                  placeholder="e.g. Understand the requirements of engineering colleges before designing potential AI education and infrastructure offerings."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Estimated Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={estMinutes}
                    onChange={(e) => setEstMinutes(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!surveyName.trim()) {
                    alert("Please provide a Survey Name.");
                    return;
                  }
                  setStep(3);
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0B132B] hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
              >
                <span>Continue to Questions</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Content Creation Mode */}
        {step === 3 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
            <div className="space-y-1 border-b border-slate-100 pb-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700">
                Step 3 of 4: Question Structure
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                How would you like to build the questions?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Choose AI generation, paste a document outline, or start with default template.
              </p>
            </div>

            {/* Mode selection tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "ai",
                  title: "AI Generation",
                  desc: "Generate full structured questions from purpose",
                  icon: Sparkles,
                },
                {
                  id: "document",
                  title: "Paste Document Text",
                  desc: "Extract sections from RFP, notes or doc",
                  icon: FileText,
                },
                {
                  id: "scratch",
                  title: "Blank Canvas",
                  desc: "Start with 1 question and build in editor",
                  icon: Layers,
                },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id as any)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-800"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? "text-teal-400" : "text-slate-600"}`} />
                    <div className="text-xs font-bold">{m.title}</div>
                    <div className={`text-[11px] mt-0.5 ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                      {m.desc}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* AI Generator prompt */}
            {mode === "ai" && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>AI Prompt / Specific Objectives</span>
                </label>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={`Generate a 10-question survey for ${companyName} regarding ${surveyName}. Ensure questions cover pain points, tools, and budget.`}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none bg-white"
                />
              </div>
            )}

            {/* Document Text input */}
            {mode === "document" && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  <span>Paste Document Content or Question Outline</span>
                </label>
                <textarea
                  rows={5}
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                  placeholder="Paste questions, sections, or study goals here..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none bg-white"
                />
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (mode === "ai" || mode === "document") {
                    handleGenerate();
                  } else {
                    setStep(4);
                  }
                }}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0B132B] hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Structuring Questions...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === "scratch" ? "Review & Finish" : "Generate & Review"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Finalize */}
        {step === 4 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
            <div className="space-y-1 border-b border-slate-100 pb-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700">
                Step 4 of 4: Confirmation
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Review Survey Configuration
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Verify the company profile and survey structure before storing to Supabase.
              </p>
            </div>

            {/* Summary Review Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider block">
                  Company / Organization
                </span>
                <div className="text-base font-black text-slate-900">{companyName}</div>
                <div className="text-slate-600">{industry}</div>
                {location && <div className="text-slate-500 font-medium">{location}</div>}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider block">
                  Survey Title &amp; Purpose
                </span>
                <div className="text-base font-black text-slate-900">{surveyName}</div>
                <div className="text-slate-600 italic">"{surveyPurpose || surveyDescription}"</div>
              </div>
            </div>

            {/* Sections & Questions Preview */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>Survey Sections ({sections.length})</span>
              </h3>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {sections.map((sec, sIdx) => (
                  <div key={sec.id || sIdx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="text-xs font-bold text-slate-900">{sec.title}</div>
                    <div className="text-[11px] text-slate-500">{sec.questions?.length || 0} questions configured</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSaveSurvey(false)}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition-colors"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveSurvey(true)}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#0B132B] hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Save &amp; Open Visual Builder</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Survey & Landing Page Created Success Modal */}
        {createdSurvey && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in duration-200">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Survey &amp; Landing Page Created!
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Your survey has been configured with dedicated branding and stored securely.
                </p>
              </div>

              {/* Information Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Organization &amp; Survey
                </div>
                <div className="text-base font-extrabold text-slate-900">
                  {createdSurvey.title}
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold">{createdSurvey.company?.name || "Organization"}</span>
                  <span>&bull;</span>
                  <span>{createdSurvey.industry || "General"}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 mt-2 truncate">
                  Slug: /surveys/{createdSurvey.slug}
                </div>
              </div>

              {/* Actions Grid */}
              <div className="space-y-2.5">
                {/* 1. View Dedicated Landing Page */}
                <Link
                  href={`/surveys/${createdSurvey.slug}`}
                  className="w-full inline-flex items-center justify-between px-5 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-teal-200" />
                    <span>View Dedicated Landing Page</span>
                  </div>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                {/* 2. Start & Test Survey */}
                <Link
                  href={`/surveys/${createdSurvey.slug}/start`}
                  className="w-full inline-flex items-center justify-between px-5 py-3.5 rounded-xl bg-[#0B132B] hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <span>Open &amp; Test Survey Runner</span>
                  </div>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                {/* 3. Visual Builder */}
                <Link
                  href={`/admin/surveys/${createdSurvey.id}/edit`}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition-colors"
                >
                  <Palette className="w-4 h-4 text-slate-500" />
                  <span>Customize in Visual Builder</span>
                </Link>

                {/* 4. Manage Surveys */}
                <Link
                  href="/admin/surveys"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <span>Return to Surveys List</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
