import { db } from "@/lib/db";
import Link from "next/link";
import {
  Building2,
  Users,
  Award,
  BookOpen,
  PlusCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    totalCompanies,
    totalParticipants,
    attempts,
    totalQuestions,
    recentAttempts,
  ] = await Promise.all([
    db.company.count(),
    db.participant.count(),
    db.assessmentAttempt.findMany({
      where: { status: "SUBMITTED" },
      select: { overallPct: true },
    }),
    db.question.count(),
    db.assessmentAttempt.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        participant: { include: { company: true } },
        assessment: true,
      },
    }),
  ]);

  const avgScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.overallPct || 0), 0) / attempts.length)
      : 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#0f172a] tracking-tight">
            Executive Analytics Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time organizational diagnostics, client benchmarking, and assessment metrics.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/companies"
            className="px-4 py-2.5 rounded-xl bg-[#1d4ed8] hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Company</span>
          </Link>

          <Link
            href="/admin/question-bank"
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 active:scale-[0.99] text-[#0f172a] text-xs font-bold uppercase tracking-wider shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#1d4ed8]" />
            <span>AI Question Generator</span>
          </Link>
        </div>
      </div>

      {/* Centered Colorful KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Companies */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-2 hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#1d4ed8] flex items-center justify-center shadow-2xs">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="text-3xl font-black text-[#0f172a] tracking-tight pt-1">
            {totalCompanies}
          </span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Active Client Companies
          </span>
          <Link
            href="/admin/companies"
            className="text-[11px] font-bold text-[#1d4ed8] hover:underline pt-1 inline-flex items-center gap-1"
          >
            View Directory &rarr;
          </Link>
        </div>

        {/* Card 2: Candidates */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-2 hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#059669] flex items-center justify-center shadow-2xs">
            <Users className="w-6 h-6" />
          </div>
          <span className="text-3xl font-black text-[#0f172a] tracking-tight pt-1">
            {totalParticipants}
          </span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Evaluated Candidates
          </span>
          <span className="text-[11px] font-semibold text-slate-400 pt-1">
            {attempts.length} Completed Submissions
          </span>
        </div>

        {/* Card 3: Average Score */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-2 hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-[#d97706] flex items-center justify-center shadow-2xs">
            <Award className="w-6 h-6" />
          </div>
          <span className="text-3xl font-black text-[#0f172a] tracking-tight pt-1">
            {avgScore}%
          </span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            System Average Score
          </span>
          <span className="text-[11px] font-semibold text-emerald-600 pt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Benchmarked Analytics
          </span>
        </div>

        {/* Card 4: Questions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-2 hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-[#7c3aed] flex items-center justify-center shadow-2xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="text-3xl font-black text-[#0f172a] tracking-tight pt-1">
            {totalQuestions}
          </span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Questions in Bank
          </span>
          <Link
            href="/admin/question-bank"
            className="text-[11px] font-bold text-[#7c3aed] hover:underline pt-1 inline-flex items-center gap-1"
          >
            Manage Question Bank &rarr;
          </Link>
        </div>
      </div>

      {/* Recent Candidate Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#0f172a] uppercase tracking-wider">
            Recent Assessment Attempts
          </h2>
          <Link
            href="/admin/companies"
            className="text-xs font-bold text-[#1d4ed8] hover:underline flex items-center gap-1"
          >
            <span>View All by Company</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentAttempts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No assessment attempts recorded yet. Candidates will appear here as they register and take tests.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Candidate</th>
                  <th className="px-6 py-3.5">Company</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Score</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAttempts.map((att) => {
                  const isSubmitted = att.status === "SUBMITTED";
                  const score = att.overallPct ? Math.round(att.overallPct) : null;

                  return (
                    <tr key={att.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-[#0f172a]">
                        {att.participant.fullName}
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">
                        {att.participant.company.name}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {att.participant.department || "General"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isSubmitted
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {isSubmitted ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Completed</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>In Progress</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                        {score !== null ? `${score}%` : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/companies/${att.participant.companyId}`}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
