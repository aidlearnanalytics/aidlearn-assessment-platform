import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { BrandLogo } from "@/components/common/BrandLogo";
import {
  CheckCircle,
  AlertCircle,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Clock,
  Award,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: { attemptId: string };
}) {
  const attempt = await db.assessmentAttempt.findUnique({
    where: { id: params.attemptId },
    include: {
      participant: { include: { company: true } },
      assessment: true,
      answers: {
        include: {
          question: {
            include: { skill: true, category: true },
          },
        },
      },
      violations: true,
    },
  });

  if (!attempt) {
    notFound();
  }

  const pct = Math.round(attempt.overallPct ?? 0);
  const totalQuestions = attempt.answers.length;
  const correctCount = attempt.answers.filter((a) => a.isCorrect).length;

  // Parse category scores safely
  let categoryScores: Record<string, number> = {};
  if (attempt.categoryScores) {
    try {
      categoryScores = JSON.parse(attempt.categoryScores);
    } catch {
      categoryScores = {};
    }
  }

  // Parse AI diagnostic safely
  let aiDiagnostic: any = null;
  if (attempt.aiDiagnostic) {
    try {
      aiDiagnostic = JSON.parse(attempt.aiDiagnostic);
    } catch {
      aiDiagnostic = null;
    }
  }

  const scoreTheme =
    pct >= 70
      ? { text: "text-[#059669]", bg: "bg-emerald-50", border: "border-emerald-200", badge: "Proficient" }
      : pct >= 50
      ? { text: "text-[#1d4ed8]", bg: "bg-blue-50", border: "border-blue-200", badge: "Intermediate" }
      : { text: "text-[#d97706]", bg: "bg-amber-50", border: "border-amber-200", badge: "Upskilling Recommended" };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <BrandLogo subtitle={attempt.participant.company.name} />
          <div className="text-right">
            <span className="text-xs font-bold text-[#0f172a] block">
              {attempt.participant.fullName}
            </span>
            <span className="text-[10px] text-slate-500">
              {attempt.participant.department || "Corporate Assessment"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Results Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 space-y-8">
        {/* Score Overview Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1d4ed8] text-[11px] font-bold">
              <Award className="w-3.5 h-3.5" />
              Evaluation Completed
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#0f172a] tracking-tight">
              Diagnostic Assessment Results
            </h1>
            <p className="text-xs text-slate-500 max-w-lg">
              {attempt.assessment.name} • Submitted on{" "}
              {new Date(attempt.submittedAt || attempt.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Centered Score Badge & Metric */}
          <div className="flex items-center gap-6">
            <div
              className={`w-32 h-32 rounded-2xl border-2 ${scoreTheme.border} ${scoreTheme.bg} flex flex-col items-center justify-center text-center p-3 shadow-xs`}
            >
              <span className={`text-4xl font-black tracking-tight ${scoreTheme.text}`}>
                {pct}%
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                {scoreTheme.badge}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#059669]" />
                <span className="text-slate-600">
                  <strong className="text-[#0f172a]">{correctCount}</strong> of {totalQuestions} Correct
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1d4ed8]" />
                <span className="text-slate-600">
                  <strong className="text-[#0f172a]">{Math.round((attempt.timeTakenSecs || 0) / 60)}</strong> Mins Taken
                </span>
              </div>
              {attempt.violations.length > 0 && (
                <div className="flex items-center gap-2 text-amber-700">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>{attempt.violations.length} Proctoring Notices</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Competency Breakdown & AI Diagnostic Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Skill Category Scores */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider pb-2 border-b border-slate-100">
              Competency Breakdown
            </h3>

            {Object.keys(categoryScores).length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No category breakdown available.</p>
            ) : (
              <div className="space-y-4 pt-2">
                {Object.entries(categoryScores).map(([cat, score]) => (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{cat}</span>
                      <span className="font-bold text-[#0f172a]">{score}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          score >= 70 ? "bg-[#059669]" : score >= 50 ? "bg-[#1d4ed8]" : "bg-[#d97706]"
                        }`}
                        style={{ width: `${Math.max(5, score)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: AI Diagnostic Report */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sparkles className="w-5 h-5 text-[#1d4ed8]" />
              <h3 className="text-sm font-bold text-[#0f172a] uppercase tracking-wider">
                AidLearn AI Diagnostic Insights
              </h3>
            </div>

            {aiDiagnostic ? (
              <div className="space-y-6">
                {/* AI Headline */}
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                  <h4 className="text-sm font-bold text-[#1d4ed8] mb-1">
                    {aiDiagnostic.headline || "Diagnostic Summary"}
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {aiDiagnostic.summary}
                  </p>
                </div>

                {/* Strengths & Weaknesses Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                    <h5 className="text-xs font-bold text-[#059669] uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      Demonstrated Strengths
                    </h5>
                    <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                      {(aiDiagnostic.strengths || []).map((s: string, idx: number) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 space-y-2">
                    <h5 className="text-xs font-bold text-[#d97706] uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      Critical Skill Gaps
                    </h5>
                    <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                      {(aiDiagnostic.weaknesses || []).map((w: string, idx: number) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommended Curriculum */}
                {aiDiagnostic.recommendedCurriculum && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <h5 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[#1d4ed8]" />
                      Recommended Training Path
                    </h5>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {aiDiagnostic.recommendedCurriculum.map((c: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-[#0f172a] shadow-xs"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4">
                Diagnostic summary evaluated. Please review with your program coordinator.
              </p>
            )}
          </div>
        </div>

        {/* Action / Next Steps CTA Banner */}
        <div className="bg-[#0f172a] text-white rounded-2xl p-8 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-lg font-bold">Bridge Your Capability Gaps with AidLearn Analytics</h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Access hands-on masterclasses in Advanced Financial Modeling, SQL Query Optimization, Power BI DAX, and Data Engineering.
            </p>
          </div>

          <a
            href="https://aidlearnanalytics.com/courses"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl bg-[#1d4ed8] hover:bg-blue-600 active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Explore Corporate Courses</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} AidLearn Analytics. Diagnostic assessment report.</p>
      </footer>
    </div>
  );
}
