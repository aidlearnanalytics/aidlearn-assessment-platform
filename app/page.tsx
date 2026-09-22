import { db } from "@/lib/db";
import CandidateRegisterForm from "@/components/candidate/CandidateRegisterForm";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Shield, Sparkles, Award, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const companies = await db.company.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      industry: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <BrandLogo subtitle="Assessment Portal" />
          <div className="flex items-center gap-4">
            <a
              href="/admin"
              className="text-xs font-semibold text-slate-600 hover:text-[#1d4ed8] px-3.5 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Admin Portal
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10 md:py-16 flex flex-col lg:flex-row items-center justify-between gap-12">
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

          <p className="text-sm md:text-base text-slate-600 leading-relaxed mb-8">
            Assess practical analytics, financial modeling, SQL, and business engineering capabilities with timed proctored evaluation and instant AI diagnostics.
          </p>

          {/* Value Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <Shield className="w-5 h-5 text-[#1d4ed8] mb-2" />
              <h4 className="text-xs font-bold text-[#0f172a]">Proctored Environment</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Automated violation logging & fullscreen monitoring</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <Sparkles className="w-5 h-5 text-[#059669] mb-2" />
              <h4 className="text-xs font-bold text-[#0f172a]">AI Diagnostic</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Pinpoints strengths & exact formula gap areas</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
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
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
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
