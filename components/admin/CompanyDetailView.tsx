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
        aiDiagnostic?: any;
        categoryScores?: any;
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

  // Selected candidate for Individual View
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    participants.length > 0 ? participants[0].id : ""
  );

  const selectedParticipant = participants.find((p) => p.id === selectedCandidateId) || participants[0];
  const selectedAttempt = selectedParticipant?.attempts[0];

  let selectedDiag: any = null;
  if (selectedAttempt?.aiDiagnostic) {
    try {
      selectedDiag =
        typeof selectedAttempt.aiDiagnostic === "string"
          ? JSON.parse(selectedAttempt.aiDiagnostic)
          : selectedAttempt.aiDiagnostic;
    } catch {
      selectedDiag = null;
    }
  }

  let selectedCatScores: Record<string, number> = {};
  if (selectedAttempt?.categoryScores) {
    try {
      selectedCatScores =
        typeof selectedAttempt.categoryScores === "string"
          ? JSON.parse(selectedAttempt.categoryScores)
          : selectedAttempt.categoryScores;
    } catch {
      selectedCatScores = {};
    }
  }

  const handleDownloadCompanyReport = async () => {
    setDownloading(true);
    try {
      window.location.href = `/api/companies/${company.id}/report`;
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setDownloading(false), 2000);
    }
  };

  const handleDownloadCandidateReport = async (attemptId: string) => {
    if (!attemptId) return;
    window.location.href = `/api/attempts/${attemptId}/report`;
  };

  return (
    <div className="space-y-8">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 text-blue-600">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{company.name}</h1>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  Active Tenant
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500 font-medium">
                Industry: <span className="text-slate-800 font-semibold">{company.industry || "Enterprise Financials & Analytics"}</span> | Registered:{" "}
                {new Date(company.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/admin/question-bank/${company.id}`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
            >
              <BookOpen className="h-4 w-4 text-blue-600" />
              Manage Question Bank
            </Link>

            <button
              onClick={handleDownloadCompanyReport}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:shadow cursor-pointer disabled:opacity-60"
            >
              <FileDown className="h-4 w-4" />
              {downloading ? "Generating Report..." : "Download Executive Report (.docx)"}
            </button>
          </div>
        </div>

        {/* 4 Metric KPI Strip */}
        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Users className="h-3.5 w-3.5 text-blue-600" /> Total Roster
            </div>
            <p className="mt-1.5 text-2xl font-black text-slate-900">{participants.length}</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Completed Exams
            </div>
            <p className="mt-1.5 text-2xl font-black text-slate-900">{completedAttempts.length}</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Award className="h-3.5 w-3.5 text-amber-600" /> Mean Score
            </div>
            <p className="mt-1.5 text-2xl font-black text-slate-900">{avgScore}%</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> Pass Rate (&ge;70%)
            </div>
            <p className="mt-1.5 text-2xl font-black text-slate-900">{passRate}%</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-4 text-sm font-bold transition-all relative ${
              activeTab === "all"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            All Candidates ({participants.length})
          </button>
          <button
            onClick={() => setActiveTab("individual")}
            className={`pb-4 text-sm font-bold transition-all relative ${
              activeTab === "individual"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Individual Candidate Diagnostics
          </button>
        </div>
      </div>

      {/* TAB 1: ALL CANDIDATES TABLE */}
      {activeTab === "all" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Candidate Evaluation Roster</h2>
              <p className="text-xs text-slate-500">Live proctoring records and performance logs</p>
            </div>
          </div>

          {participants.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-700">No candidates registered yet</h3>
              <p className="mt-1 text-xs text-slate-400">
                Direct candidates to the portal home to register under {company.name}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Candidate</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Score</th>
                    <th className="px-6 py-3.5">Proctoring Flags</th>
                    <th className="px-6 py-3.5">Submitted At</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {participants.map((p) => {
                    const att = p.attempts[0];
                    const scorePct = att?.overallPct !== null && att?.overallPct !== undefined ? Math.round(att.overallPct) : null;
                    const passed = scorePct !== null && scorePct >= 70;
                    const violationsCount = att?.violations?.length || 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{p.fullName}</div>
                          <div className="text-[11px] text-slate-400">{p.email}</div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-600">{p.department || "General"}</td>
                        <td className="px-6 py-4">
                          {att ? (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                att.status === "SUBMITTED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {att.status}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">Not Started</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {scorePct !== null ? (
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-black text-sm ${
                                  passed ? "text-emerald-600" : scorePct >= 50 ? "text-amber-600" : "text-red-600"
                                }`}
                              >
                                {scorePct}%
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold">
                                {passed ? "(Pass)" : "(Needs Training)"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">---</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {violationsCount === 0 ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Clean (0)
                            </span>
                          ) : (
                            <span className="text-amber-700 font-semibold flex items-center gap-1 text-[11px]">
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> {violationsCount} flags
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {att?.submittedAt
                            ? new Date(att.submittedAt).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "---"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {att && att.status === "SUBMITTED" ? (
                            <button
                              onClick={() => handleDownloadCandidateReport(att.id)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              <FileDown className="w-3.5 h-3.5" /> Report (.docx)
                            </button>
                          ) : (
                            <span className="text-slate-300 text-xs">No Report</span>
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

      {/* TAB 2: INDIVIDUAL CANDIDATE DIAGNOSTIC VIEW */}
      {activeTab === "individual" && (
        <div className="space-y-6">
          {/* Candidate Selector Dropdown */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Select Candidate to Review
              </label>
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="w-full sm:w-80 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.email}) - {p.department || "General"}
                  </option>
                ))}
              </select>
            </div>

            {selectedAttempt && selectedAttempt.status === "SUBMITTED" && (
              <button
                onClick={() => handleDownloadCandidateReport(selectedAttempt.id)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:shadow cursor-pointer"
              >
                <FileDown className="h-4 w-4" />
                Download Candidate Report (.docx)
              </button>
            )}
          </div>

          {/* Diagnostic Breakdown Details */}
          {selectedParticipant && selectedAttempt ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Candidate Summary Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">{selectedParticipant.fullName}</h3>
                  <p className="text-xs text-slate-500">{selectedParticipant.email}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-700">Department: {selectedParticipant.department || "General"}</p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 text-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Competency Score</span>
                  <div className="mt-2 flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-black text-blue-600">
                      {Math.round(selectedAttempt.overallPct ?? 0)}%
                    </span>
                  </div>
                  <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                      (selectedAttempt.overallPct || 0) >= 70
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : (selectedAttempt.overallPct || 0) >= 50
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {(selectedAttempt.overallPct || 0) >= 70
                      ? "Proficient / Advanced"
                      : (selectedAttempt.overallPct || 0) >= 50
                      ? "Competent with Gaps"
                      : "Foundational Upskilling Needed"}
                  </span>
                </div>

                {/* Category Competency Matrix */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                    Category Proficiency Breakdown
                  </h4>
                  {Object.keys(selectedCatScores).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(selectedCatScores).map(([cat, score]) => (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-700">{cat}</span>
                            <span className="text-slate-900 font-bold">{score}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"
                              }`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No category breakdown available.</p>
                  )}
                </div>

                {/* Proctoring Log Summary */}
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Proctoring Audit
                  </h4>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Recorded Violations:</span>
                    <span className="font-bold text-slate-900">{selectedAttempt.violations.length}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: AI Diagnostic & Action Plan */}
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {selectedDiag?.headline || "AI Skill Gap & Diagnostic Feedback"}
                      </h3>
                      <p className="text-xs text-slate-500">Automated diagnostic assessment synthesis</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {selectedDiag?.summary ||
                      "The candidate completed the assessment and demonstrated solid foundational aptitude with key growth areas in modern analytical calculation methods."}
                  </p>

                  {/* Strengths and Gaps Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Demonstrated Strengths
                      </h4>
                      <ul className="space-y-1.5 text-xs text-emerald-900">
                        {selectedDiag?.strengths && selectedDiag.strengths.length > 0 ? (
                          selectedDiag.strengths.map((s: string, idx: number) => <li key={idx}>• {s}</li>)
                        ) : (
                          <li>• Solid understanding of basic formula logic and workflows.</li>
                        )}
                      </ul>
                    </div>

                    <div className="rounded-xl bg-red-50/60 border border-red-100 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-red-800 mb-2 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-red-600" /> Capability Gaps
                      </h4>
                      <ul className="space-y-1.5 text-xs text-red-900">
                        {selectedDiag?.weaknesses && selectedDiag.weaknesses.length > 0 ? (
                          selectedDiag.weaknesses.map((w: string, idx: number) => <li key={idx}>• {w}</li>)
                        ) : (
                          <li>• Complex formula chaining and dynamic array execution.</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Recommended Training Modules */}
                  <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-blue-600" /> Recommended AidLearn Analytics Modules
                    </h4>
                    <ul className="space-y-1.5 text-xs text-blue-950 font-medium">
                      {selectedDiag?.recommendedCurriculum && selectedDiag.recommendedCurriculum.length > 0 ? (
                        selectedDiag.recommendedCurriculum.map((m: string, idx: number) => <li key={idx}>• {m}</li>)
                      ) : (
                        <>
                          <li>• AidLearn Advanced Financial Modeling Masterclass</li>
                          <li>• SQL for Enterprise Business Intelligence & Analytics</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-700">No assessment attempt recorded</h3>
              <p className="mt-1 text-xs text-slate-400">
                This candidate has not yet submitted an assessment attempt.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
