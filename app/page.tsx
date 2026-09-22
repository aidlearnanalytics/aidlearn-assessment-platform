import { db } from "@/lib/db";
import CandidateRegisterForm from "@/components/candidate/CandidateRegisterForm";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Shield, Sparkles, Award, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let companies: any[] = [];
  try {
    companies = await db.company.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        industry: true,
      },
      orderBy: { name: "asc" },
    });
  } catch (err) {
    console.error("Failed to load companies:", err);
    companies = [];
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      {/* Normal AidLearn Brand Blue Header matching main site */}
      <header className="sticky top-0 z-50 h-16 bg-[#1d4ed8] shadow-[0_2px_20px_rgba(0,0,0,0.15)] flex items-center px-4 sm:px-6 lg:px-10">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="https://aidlearnanalytics.com" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-white p-1.5 shadow-sm flex items-center justify-center">
                <img
                  src="/brand/aidlearn-symbol-transparent.png"
                  alt="AidLearn Analytics Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold text-white tracking-tight leading-tight">
                  AIDLEARN <span className="text-[#facc15]">ANALYTICS</span>
                </span>
                <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider">
                  Assessment Suite
                </span>
              </div>
            </a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://aidlearnanalytics.com"
              className="text-xs sm:text-sm font-semibold text-white/80 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10 hidden sm:inline-block"
            >
              Main Platform
            </a>
            <a
              href="/admin"
              className="inline-flex items-center rounded-lg bg-[#facc15] px-4 py-2 text-xs sm:text-sm font-extrabold text-[#0f172a] transition hover:bg-white hover:scale-[1.02] shadow-sm"
            >
              Admin Portal
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-10 md:py-16 flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Left Column: Platform Value & Intro */}
        <div className="flex-1 max-w-xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#1d4ed8] text-xs font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            Empowered by AidLearn AI Analytics
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-[#0f172a] tracking-tight leading-tight mb-4">
            Organizational Skills <br className="hidden sm:inline" />
            <span className="text-[#1d4ed8]">Diagnostics & Benchmarking</span>
          </h1>

          <p className="text-sm md:text-base text-slate-600 leading-relaxed mb-8 font-normal">
            Assess practical analytics, financial modeling, SQL, and business engineering capabilities with timed proctored evaluation and instant AI diagnostics.
          </p>

          {/* Value Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm">
              <Shield className="w-5 h-5 text-[#1d4ed8] mb-2" />
              <h4 className="text-xs font-bold text-[#0f172a]">Proctored Environment</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Automated violation logging and fullscreen monitoring</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm">
              <Sparkles className="w-5 h-5 text-[#059669] mb-2" />
              <h4 className="text-xs font-bold text-[#0f172a]">AI Diagnostic</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Pinpoints strengths and exact formula gap areas</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm">
              <Award className="w-5 h-5 text-[#d97706] mb-2" />
              <h4 className="text-xs font-bold text-[#0f172a]">Executive Reports</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Instant downloadable Word reports for leadership</p>
            </div>
          </div>
        </div>

        {/* Right Column: Registration Card */}
        <div className="w-full lg:w-[460px]">
          <CandidateRegisterForm companies={companies} />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} AidLearn Analytics Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="https://aidlearnanalytics.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#1d4ed8] transition-colors font-medium">
              Main Website
            </a>
            <a href="https://aidlearnanalytics.com/courses" target="_blank" rel="noopener noreferrer" className="hover:text-[#1d4ed8] transition-colors font-medium">
              Corporate Courses
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
