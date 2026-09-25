import Link from "next/link";
import {
  Cpu,
  Clock,
  ShieldCheck,
  ArrowRight,
  GraduationCap,
  BookOpen,
  Briefcase,
  Building2,
  Sparkles,
  Server,
  Award,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { SURVEY_INTRO_TEXT } from "@/lib/survey-data";

export default function HomePage() {
  const tracks = [
    {
      id: "student",
      title: "Students & Club Leads",
      description:
        "Tell us about your capstone AI projects, compute bottlenecks, and what tools or mentor hours would accelerate your team.",
      role: "IEEE / ACM / GDSC Leads & Hackathon Teams",
      icon: GraduationCap,
      href: "/survey?role=student",
      tag: "Section D • 10 Questions",
    },
    {
      id: "faculty",
      title: "HODs & Faculty Members",
      description:
        "Share your perspective on final-year project completion, curriculum gaps, GenAI lab sandboxes, and faculty upskilling.",
      role: "Department Heads & Project Guides",
      icon: BookOpen,
      href: "/survey?role=faculty",
      tag: "Section B • 10 Questions",
    },
    {
      id: "tpo",
      title: "Training & Placement Officers",
      description:
        "Help us understand recruiter feedback, GenAI skill gaps in hiring interviews, and appetite for mentored project tracks.",
      role: "Placement Heads & Corporate Liaisons",
      icon: Briefcase,
      href: "/survey?role=tpo",
      tag: "Section C • 10 Questions",
    },
    {
      id: "admin",
      title: "Principals & Deans",
      description:
        "Guide institutional AI strategy, sovereign on-prem vs cloud GPU infra, NBA/NIRF outcome requirements, and pilot models.",
      role: "Directors & Academic Leadership",
      icon: Building2,
      href: "/survey?role=admin",
      tag: "Section A • 10 Questions",
    },
  ];

  const pillars = [
    {
      icon: Server,
      title: "Sovereign Cloud & Lab Compute",
      description:
        "High-performance NVIDIA GPU clusters deployed in India with dedicated VPC and student quota isolation.",
    },
    {
      icon: Layers,
      title: "Pre-configured AI Sandboxes",
      description:
        "Ready-to-run Jupyter environments preloaded with LLMs, RAG frameworks, Deep Learning models, and dataset caches.",
    },
    {
      icon: Award,
      title: "Mentored Capstone Tracks",
      description:
        "Bridge the recruiter gap with industry-grade code reviews, system design mentorship, and co-branded certifications.",
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-8">
        {/* Top Badges */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-xs">
            <Cpu className="w-3.5 h-3.5 text-teal-400" />
            <span>KOLABA CLOUD AI</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Engineering Colleges AI Survey</span>
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>3–4 minutes</span>
          </span>
        </div>

        {/* Main Title */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-tight">
            Shaping the Future of AI & GPU Infrastructure for Indian Engineering Colleges
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {`"We're speaking with students, faculty and college leaders to understand where AI projects, compute access, mentorship and placement support can make the biggest difference."`}
          </p>
        </div>

        {/* CTA Area */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/survey"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-[#0B132B] text-white text-base font-bold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Start Survey</span>
            <ArrowRight className="w-5 h-5 text-teal-400" />
          </Link>

          <Link
            href="/admin/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 transition-colors shadow-xs"
          >
            <span>View Admin Analytics</span>
          </Link>
        </div>

        {/* Trust / Privacy Note */}
        <div className="pt-4 flex items-center justify-center gap-2 text-xs text-slate-500 max-w-xl mx-auto">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
          <p className="text-left sm:text-center leading-normal">
            Research-only initiative. We are not selling products with this form. Your responses are strictly used for academic needs analysis.
          </p>
        </div>
      </section>

      {/* 4 Persona Cards Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Select Your Role & Begin
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Four tailored 10-question dynamic flows customized for your specific institutional vantage point.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tracks.map((track) => {
            const Icon = track.icon;
            return (
              <Link
                key={track.id}
                href={track.href}
                className="group p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-[#0B132B] flex items-center justify-center text-slate-900 group-hover:text-white transition-colors duration-200">
                      <Icon className="w-6 h-6 text-slate-700 group-hover:text-teal-400" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                      {track.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#0B132B] transition-colors">
                      {track.title}
                    </h3>
                    <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider mt-0.5">
                      {track.role}
                    </p>
                    <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
                      {track.description}
                    </p>
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-sm font-semibold text-slate-900 group-hover:text-teal-700">
                  <span>Start this track (10 Qs)</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Program Pillars */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-[#0B132B] text-white rounded-3xl p-8 sm:p-12 shadow-md">
          <div className="max-w-2xl mb-10 space-y-2">
            <span className="text-xs font-bold text-teal-400 tracking-wider uppercase">
              Kolaba Cloud AI Initiative
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Why Kolaba Cloud AI is Partnering with Colleges
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              We provide sovereign compute capacity, industry AI curriculums, and direct recruiter pathways for India&apos;s next generation of engineers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">{p.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {p.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Research Disclosure Appendix */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Academic Research & Ethics Statement
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {SURVEY_INTRO_TEXT}
          </p>
        </div>
      </section>
    </div>
  );
}
