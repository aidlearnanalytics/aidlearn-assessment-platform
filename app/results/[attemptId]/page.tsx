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
      categoryScores =
        typeof attempt.categoryScores === "string"
          ? JSON.parse(attempt.categoryScores)
          : (attempt.categoryScores as any);
    } catch {
      categoryScores = {};
    }
  }

  // Parse AI diagnostic safely
  let aiDiagnostic: any = null;
  if (attempt.aiDiagnostic) {
    try {
      aiDiagnostic =
        typeof attempt.aiDiagnostic === "string"
          ? JSON.parse(attempt.aiDiagnostic)
          : (attempt.aiDiagnostic as any);
    } catch {
      aiDiagnostic = null;
    }
  }

  const scoreTheme =
    pct >= 70
      ? { text: "text-[#059669]", bg: "bg-emerald-50", border: "border-emerald-200", badge: "Proficient" }
      : pct >= 50
      ? { text: "text-[#1d4ed8]", bg: "bg-blue-50", border: "border-blue-200", badge: "Intermediate" }
      : { text: "text-[#dc2626]", bg: "bg-red-50", border: "border-red-200", badge: "Foundational Upskilling Needed" };

  const violationsCount = attempt.violations.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <BrandLogo subtitle="Diagnostic Results" />
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
              Candidate: <span className="text-slate-900 font-bold">{attempt.participant.fullName}</span>
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {attempt.participant.company.name}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 space-y-8">
        {/* Score Card Hero */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm text-center relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
              <Award className="w-4 h-4 text-blue-600" />
              Official Diagnostic Evaluation
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Assessment Completed
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Thank you, {attempt.participant.fullName}. Your skills evaluation for{" "}
              <span className="text-slate-800 font-bold">{attempt.participant.company.name}</span> has been scored and analyzed.
            </p>

            {/* Score Ring / Badge */}
            <div className="py-6">
              <div className="inline-flex flex-col items-center justify-center w-40 h-40 rounded-full border-4 border-slate-100 bg-slate-50/50 shadow-inner">
                <span className={`text-5xl font-black ${scoreTheme.text}`}>{pct}%</span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  Overall Score
                </span>
              </div>
            </div>

            {/* Score Status Pill */}
            <div>
              <span className={`inline-flex px-4 py-1.5 rounded-full text-xs font-extrabold border ${scoreTheme.bg} ${scoreTheme.text} ${scoreTheme.border}`}>
                {scoreTheme.badge}
              </span>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100 max-w-lg mx-auto text-xs">
              <div className="flex flex-col items-center">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Correct Answers</span>
                <span className="text-base font-black text-slate-900 mt-0.5">
                  {correctCount} / {totalQuestions}
                </span>
              </div>
              <div className="flex flex-col items-center border-x border-slate-200">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Time Taken</span>
                <span className="text-base font-black text-slate-900 mt-0.5">
                  {Math.round((attempt.timeTakenSecs ?? 0) / 60)} mins
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Integrity Audit</span>
                <span className={`text-base font-black mt-0.5 ${violationsCount === 0 ? "text-emerald-600" : "text-amber-600"}`}>
                  {violationsCount === 0 ? "Clean (0)" : `${violationsCount} flags`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Competency Category Breakdown */}
        {Object.keys(categoryScores).length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              Competency Breakdown
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(categoryScores).map(([cat, score]) => (
                <div key={cat} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">{cat}</span>
                    <span className="text-slate-900 font-mono">{score}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-blue-600" : "bg-red-500"
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Diagnostic Report */}
        {aiDiagnostic && (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {aiDiagnostic.headline || "Diagnostic Performance Feedback"}
                </h2>
                <p className="text-xs text-slate-500 font-medium">Personalized AI Capability Diagnostic</p>
              </div>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              {aiDiagnostic.summary}
            </p>

            {/* Strengths & Weaknesses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Key Strengths
                </h3>
                <ul className="space-y-2 text-xs text-emerald-950 font-medium leading-relaxed">
                  {aiDiagnostic.strengths?.map((str: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Identified Skill Gaps
                </h3>
                <ul className="space-y-2 text-xs text-amber-950 font-medium leading-relaxed">
                  {aiDiagnostic.weaknesses?.map((weak: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommended Curriculum */}
            {aiDiagnostic.recommendedCurriculum && aiDiagnostic.recommendedCurriculum.length > 0 && (
              <div className="p-6 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Recommended AidLearn Learning Modules
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {aiDiagnostic.recommendedCurriculum.map((curr: string, i: number) => (
                    <div key={i} className="p-3 bg-white rounded-xl border border-blue-200 text-xs font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      {curr}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA to Main Platform */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 sm:p-12 text-white shadow-lg text-center space-y-6">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Bridge Your Capability Gaps with AidLearn Analytics
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 font-medium leading-relaxed">
              Explore instructor-led masterclasses, live practical projects, and industry certifications tailored for modern workplace analytics.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://aidlearnanalytics.com/courses"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white text-blue-700 font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-blue-50 transition-all cursor-pointer"
            >
              Explore Course Catalog <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
