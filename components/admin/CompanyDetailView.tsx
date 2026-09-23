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
  RotateCcw,
  RefreshCw,
  Check,
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
  const [participantsList, setParticipantsList] = useState(company.participants);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const completedAttempts = participantsList
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
    participantsList.length > 0 ? participantsList[0].id : ""
  );

  const selectedParticipant = participantsList.find((p) => p.id === selectedCandidateId) || participantsList[0];
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

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
    try {
      window.location.href = `/api/attempts/${attemptId}/report`;
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetAttempt = async (attemptId: string, participantName: string, participantId: string) => {
    if (!confirm(`Are you sure you want to allow a retake for ${participantName}? This will reset their previous assessment attempt so they can take the assessment again.`)) {
      return;
    }

    setResettingId(attemptId);
    try {
      const res = await fetch(`/api/attempts/${attemptId}/reset`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Optimistically update local participants list
        setParticipantsList((prev) =>
          prev.map((p) => {
            if (p.id === participantId) {
              return {
                ...p,
                attempts: p.attempts.filter((a) => a.id !== attemptId),
              };
            }
            return p;
          })
        );
        showToast(`Assessment attempt reset. ${participantName} can now register and retake the assessment.`);
      } else {
        alert(data.error || "Failed to reset candidate attempt.");
      }
    } catch (err: any) {
      alert("Error resetting attempt: " + err.message);
    } finally {
      setResettingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900 text-white px-4 py-3 text-xs font-semibold shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center font-black text-2xl shadow-md">
              {company.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  {company.industry || "Corporate Client"}
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-xs text-slate-500">
                  Registered {new Date(company.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{company.name}</h1>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">ID: {company.slug}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/admin/question-bank/${company.id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4" /> Question Bank
            </Link>

            <button
              type="button"
              onClick={handleDownloadCompanyReport}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-colors cursor-pointer disabled:opacity-60"
            >
              <FileDown className="w-4 h-4" />
              <span>{downloading ? "Preparing Report..." : "Executive Report (.docx)"}</span>
            </button>
          </div>
        </div>

        {/* Aggregate Benchmark Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Registered</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">{participantsList.length}</span>
              <span className="text-xs text-slate-500">candidates</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Completed Assessments</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">{completedAttempts.length}</span>
              <span className="text-xs text-slate-500">submitted</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Average Score</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-blue-900">{avgScore}%</span>
              <span className="text-xs text-blue-700">mean</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Benchmark Pass Rate</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-900">{passRate}%</span>
              <span className="text-xs text-emerald-700">&ge; 70% benchmark</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for All Candidates vs Individual Deep-Dive */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
            activeTab === "all"
              ? "border-[#1d4ed8] text-[#1d4ed8]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Candidate Roster ({participantsList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("individual")}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
            activeTab === "individual"
              ? "border-[#1d4ed8] text-[#1d4ed8]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Individual Diagnostic Feedback
        </button>
      </div>

      {/* Tab 1: All Candidates Table */}
      {activeTab === "all" && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Candidate Evaluation List
              </h2>
              <p className="text-xs text-slate-500">
                Click on any candidate to inspect their detailed diagnostic report or reset their attempt for retakes.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Department / Focus</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Evaluation Status</th>
                  <th className="py-3 px-4">Violations</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {participantsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No candidates registered for this company yet.
                    </td>
                  </tr>
                ) : (
                  participantsList.map((p) => {
                    const attempt = p.attempts[0];
                    const hasSubmitted = attempt && attempt.status === "SUBMITTED";
                    const scorePct =
                      attempt?.overallPct !== null && attempt?.overallPct !== undefined
                        ? Math.round(attempt.overallPct)
                        : null;
                    const passed = scorePct !== null && scorePct >= 70;
                    const violationsCount = attempt?.violations?.length || 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{p.fullName}</div>
                          <div className="text-[11px] text-slate-500 font-medium">{p.email}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-slate-600">{p.department || "General"}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          {scorePct !== null ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-sm text-slate-900">{scorePct}%</span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  passed
                                    ? "bg-emerald-50 text-emerald-700"
                                    : scorePct >= 50
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-red-50 text-red-700"
                                }`}
                              >
                                {passed ? "Pass" : scorePct >= 50 ? "Competent" : "Upskill"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Not taken</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {hasSubmitted ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                            </span>
                          ) : attempt ? (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                              <Clock className="w-3.5 h-3.5" /> In Progress
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">Registered</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {attempt ? (
                            <span
                              className={`font-semibold ${
                                violationsCount === 0 ? "text-emerald-600" : "text-amber-600"
                              }`}
                            >
                              {violationsCount === 0 ? "Clean (0)" : `${violationsCount} Flags`}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {attempt && (
                              <button
                                type="button"
                                title="Allow candidate to retake this assessment"
                                onClick={() => handleResetAttempt(attempt.id, p.fullName, p.id)}
                                disabled={resettingId === attempt.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <RotateCcw className={`w-3.5 h-3.5 ${resettingId === attempt.id ? "animate-spin" : ""}`} />
                                <span>{resettingId === attempt.id ? "Resetting..." : "Allow Retake"}</span>
                              </button>
                            )}

                            {hasSubmitted && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCandidateId(p.id);
                                  setActiveTab("individual");
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                              >
                                <span>Diagnostics</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Individual Candidate Detailed Diagnostic */}
      {activeTab === "individual" && (
        <div className="space-y-6">
          {/* Candidate Selector Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label htmlFor="candidate-select" className="text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                Select Candidate:
              </label>
              <select
                id="candidate-select"
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="w-full sm:w-72 rounded-xl border border-slate-300 px-3 py-2 text-xs bg-slate-50 font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {participantsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.email})
                  </option>
                ))}
              </select>
            </div>

            {selectedAttempt && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleResetAttempt(selectedAttempt.id, selectedParticipant.fullName, selectedParticipant.id)}
                  disabled={resettingId === selectedAttempt.id}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${resettingId === selectedAttempt.id ? "animate-spin" : ""}`} />
                  <span>Allow Retake / Reset Attempt</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadCandidateReport(selectedAttempt.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Candidate Report (.docx)</span>
                </button>
              </div>
            )}
          </div>

          {selectedAttempt ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Metrics & Competencies */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Candidate</span>
                  <h3 className="text-lg font-black text-slate-900">{selectedParticipant.fullName}</h3>
                  <p className="text-xs text-slate-500 font-medium">{selectedParticipant.email}</p>
                </div>

                {/* Score Dial */}
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-5 text-center">
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

                {/* Diagnostic Summary */}
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Assessment Diagnostics
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
                          selectedDiag.strengths.map((s: string, idx: number) => <li key={idx}>- {s}</li>)
                        ) : (
                          <li>- Solid understanding of basic formula logic and workflows.</li>
                        )}
                      </ul>
                    </div>

                    <div className="rounded-xl bg-red-50/60 border border-red-100 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-red-800 mb-2 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-red-600" /> Capability Gaps
                      </h4>
                      <ul className="space-y-1.5 text-xs text-red-900">
                        {selectedDiag?.weaknesses && selectedDiag.weaknesses.length > 0 ? (
                          selectedDiag.weaknesses.map((w: string, idx: number) => <li key={idx}>- {w}</li>)
                        ) : (
                          <li>- Complex formula chaining and dynamic array execution.</li>
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
                        selectedDiag.recommendedCurriculum.map((m: string, idx: number) => <li key={idx}>- {m}</li>)
                      ) : (
                        <>
                          <li>- AidLearn Advanced Financial Modeling</li>
                          <li>- Excel Dynamic Arrays & Masterclass</li>
                          <li>- SQL for Business Intelligence</li>
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
