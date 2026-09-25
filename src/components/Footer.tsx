import Link from "next/link";
import { Cpu, Mail, Phone, Globe, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0B132B] flex items-center justify-center text-white">
                <Cpu className="w-4 h-4 text-teal-400" />
              </div>
              <span className="font-bold text-slate-900 tracking-tight">
                KOLABA CLOUD AI
              </span>
            </div>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed">
              Bengaluru-based enterprise AI company powering sovereign GPU compute, 
              applied GenAI infrastructure, and industry-grade research labs for India's 
              leading engineering institutions.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Independent Academic & Infrastructure Research Study</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Survey Tracks
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/survey?role=student" className="hover:text-teal-700 transition-colors">
                  Students & Club Leads
                </Link>
              </li>
              <li>
                <Link href="/survey?role=faculty" className="hover:text-teal-700 transition-colors">
                  HODs & Faculty Members
                </Link>
              </li>
              <li>
                <Link href="/survey?role=tpo" className="hover:text-teal-700 transition-colors">
                  Placement Officers (TPOs)
                </Link>
              </li>
              <li>
                <Link href="/survey?role=admin" className="hover:text-teal-700 transition-colors">
                  Principals & Deans
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Direct Contact
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <a href="mailto:info@kolabacloud.com" className="hover:text-slate-900">
                  info@kolabacloud.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <a href="tel:+919380793114" className="hover:text-slate-900">
                  +91 93807 93114
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-400" />
                <a href="https://kolabacloud.com" target="_blank" rel="noreferrer" className="hover:text-slate-900">
                  kolabacloud.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Kolaba Cloud AI. All rights reserved.</p>
          <p>
            Survey responses are stored securely and used strictly for academic collaboration & pilot sizing.
          </p>
        </div>
      </div>
    </footer>
  );
}
