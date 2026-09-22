"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Award,
  FileDown,
  BookOpen,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Phone,
  Mail,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

interface CompanyDetailProps {
  company: {
    id: string;
    name: string;
    slug: string;
    industry?: string | null;
    createdAt: string | Date;
    assessments: Array<{
      id: string;
      name: string;
      durationMinutes: number;
      isPublished: boolean;
      questions: Array<{ id: string }>;
    }>;
    participants: Array<{
      id: string;
      fullName: string;
      email: string;
      phone?: string | null;
      department?: string | null;
      createdAt: string | Date;
      attempts: Array<{
        id: string;
        status: string;
        overallScore?: number | null;
        overallPct?: number | null;
        timeTakenSecs?: number | null;
        aiDiagnostic?: string | null;
        categoryScores?: string | null;
        submittedAt?: string | Date | null;
        violations: Array<{ id: string; type: string; detail?: string | null }>;
      }>;
    }>;
  };
}

export default function CompanyDetailView({ company }: CompanyDetailProps) {
  const [activeTab, setActiveTab] = useState<"all" | "individual">("all");
  const [downloading, setDownloading] = useState(false);

  const participants = company.participants;
  const completedAttempts = participants
    .flatMap((p) => p.attempts)
    .filter((a) => a.status === "SUBMITTED");

  const avgScore =
    completedAttempts.length > 0
      ? Math.round(
          completedAttempts.reduce((sum, a) => sum + (a.overallPct || 0), 0) / completedAttempts.length
        )
      : 0;

  const passedCount = completedAttempts.filter((a) => (a.overallPct || 0) >= 70).length;
  const passRate = completedAttempts.length > 0 ? Math.round((passedCount / completedAttempts.length) * 100) : 0;

  const handleDownloadCompanyReport = async () => {
    setDownloading(true);
    try {
      window.location.href = `/api/companies/${company.id}/report`;
    } finally {
      setTimeout(() => setDownloading(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Company Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#1d4ed8] flex items-center justify-center font-bold text-base shadow-2xs">
              {company.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-[#0f172a] tracking-tight">{company.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                  {company.industry || "Corporate Client"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Client ID: <span className="font-mono text-slate-700">{company.slug}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/question-bank/${company.id}`}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[#0f172a] text-xs font-bold transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#1d4ed8]" />
            <span>Manage Questions</span>
          </Link>

          <button
            onClick={handleDownloadCompanyReport}
            disabled={downloading}
            className="px-4 py-2.5 rounded-xl bg-[#1d4ed8] hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <FileDown className="w-4 h-4" />
            <span>{downloading ? "Preparing Report..." : "Download Executive Report (.docx)"}</span>
          </button>
        </div>
      </div>

      {/* Centered KPI Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-1.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1d4ed8] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-[#0f172a]">{participants.length}</span>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Candidates
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-1.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-[#0f172a]">{completedAttempts.length}</span>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Completed Evaluations
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-1.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#d97706] flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-[#0f172a]">{avgScore}%</span>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Organizational Avg Score
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-1.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#7c3aed] flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-[#0f172a]">{passRate}%</span>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Proficiency Pass Rate (≥70%)
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "all"
              ? "border-[#1d4ed8] text-[#1d4ed8]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>All Candidates ({participants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("individual")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "individual"
              ? "border-[#1d4ed8] text-[#1d4ed8]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Individual Diagnostic Breakdown</span>
        </button>
      </div>

      {/* TAB 1: ALL CANDIDATES TABLE */}
      {activeTab === "all" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {participants.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No candidates have registered under this company yet. Share the portal link with candidates to begin.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Candidate Name</th>
                    <th className="px-6 py-3.5">Contact Details</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Score</th>
                    <th className="px-6 py-3.5 text-right">Proctoring</th>
                    <th className="px-6 py-3.5 text-right">Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {participants.map((p) => {
                    const latest = p.attempts[0];
                    const isSubmitted = latest?.status === "SUBMITTED";
                    const score = latest?.overallPct !== undefined && latest?.overallPct !== null ? Math.round(latest.overallPct) : null;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 font-bold text-[#0f172a]">
                          {p.fullName}
                        </td>
                        <td className="px-6 py-4 text-slate-500 space-y-0.5">
                          <div className="flex items-center gap-1 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{p.email}</span>
                          </div>
                          {p.phone && (
                            <div className="flex items-center gap-1 text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{p.phone}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {p.department || "General"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isSubmitted
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : latest
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {isSubmitted ? "Completed" : latest ? "In Progress" : "Registered"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                          {score !== null ? `${score}%` : "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {latest && latest.violations.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-semibold text-[11px]">
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                              {latest.violations.length} Notices
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Clean</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {latest && (
                            <a
                              href={`/api/attempts/${latest.id}/report`}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[#1d4ed8] font-semibold text-[11px] shadow-2xs inline-flex items-center gap-1"
                            >
                              <FileDown className="w-3 h-3" />
                              <span>.docx</span>
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INDIVIDUAL CANDIDATES DIAGNOSTIC CARDS */}
      {activeTab === "individual" && (
        <div className="space-y-6">
          {participants.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              No candidates available to display.
            </div>
          ) : (
            participants.map((p) => {
              const attempt = p.attempts[0];
              const isSubmitted = attempt?.status === "SUBMITTED";
              const score = attempt?.overallPct ? Math.round(attempt.overallPct) : null;

              let diag: any = null;
              if (attempt?.aiDiagnostic) {
                try {
                  diag = JSON.parse(attempt.aiDiagnostic);
                } catch {
                  diag = null;
                }
              }

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6"
                >
                  {/* Candidate Header in Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#0f172a]">{p.fullName}</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {p.department || "General"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {p.email} {p.phone ? `• ${p.phone}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      {score !== null && (
                        <div className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-center">
                          <span className="text-xl font-black text-[#1d4ed8]">{score}%</span>
                          <span className="text-[10px] font-bold text-slate-500 block uppercase">Overall Score</span>
                        </div>
                      )}

                      {attempt && (
                        <a
                          href={`/api/attempts/${attempt.id}/report`}
                          className="px-4 py-2.5 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold shadow-2xs inline-flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <FileDown className="w-4 h-4" />
                          <span>Download Candidate Report (.docx)</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Candidate AI Diagnostic Breakdown */}
                  {diag ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                        <h4 className="text-xs font-bold text-[#1d4ed8] uppercase tracking-wider mb-1">
                          {diag.headline || "Diagnostic Summary"}
                        </h4>
                        <p className="text-xs text-slate-700 leading-relaxed">{diag.summary}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1.5">
                          <h5 className="text-[11px] font-bold text-[#059669] uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Key Strengths
                          </h5>
                          <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                            {(diag.strengths || []).map((s: string, idx: number) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 space-y-1.5">
                          <h5 className="text-[11px] font-bold text-[#d97706] uppercase tracking-wider flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" /> Critical Skill Gaps
                          </h5>
                          <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                            {(diag.weaknesses || []).map((w: string, idx: number) => (
                              <li key={idx}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {diag.recommendedCurriculum && (
                        <div className="pt-2">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                            Recommended Training Modules:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {diag.recommendedCurriculum.map((c: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      {isSubmitted ? "No diagnostic data generated for this candidate." : "Candidate has not submitted the assessment yet."}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
