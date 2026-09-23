import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { CheckCircle, AlertCircle, Sparkles, BookOpen, ShieldCheck, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { AIDLEARN_OFFICIAL_COURSES } from "@/lib/gemini";

interface Props {
  params: { attemptId: string };
}

export default async function AssessmentResultPage({ params }: Props) {
  const { attemptId } = params;

  const attempt = await db.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      participant: { include: { company: true } },
      assessment: {
        include: {
          questions: {
            include: { question: true },
          },
        },
      },
      violations: true,
      answers: true,
    },
  });

  if (!attempt) {
    notFound();
  }

  const participant = attempt.participant;
  const assessment = attempt.assessment;
  const totalQuestions = assessment.questions.length;
  const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
  const rawScore = attempt.overallScore ?? 0;
  const pct = Math.round(attempt.overallPct ?? (totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0));
  const categoryScores = (attempt.categoryScores as Record<string, any>) || {};
  const aiDiagnostic = (attempt.aiDiagnostic as any) || null;
  const violationsCount = attempt.violations.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased py-8 px-4 sm:px-6 lg:px-8">
      <main className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1d4ed8] flex items-center justify-center text-white font-black text-xl shadow-md">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-[#1d4ed8]">AidLearn Analytics</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1d4ed8] border border-blue-100">
                  Performance Diagnostic
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-[#0f172a]">{assessment.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`/api/attempts/${attempt.id}/report`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-slate-50 transition-all cursor-pointer"
            >
              Download Report (.docx)
            </a>
          </div>
        </div>

        {/* Candidate Profile & Score Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Candidate Evaluation</span>
              <h2 className="text-xl sm:text-2xl font-black text-[#0f172a]">{participant.fullName}</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {participant.company.name} &bull; {participant.email}
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Assessment Completed</span>
            </div>
          </div>

          {/* Primary Metric Hero Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Overall Proficiency Score</span>
              <div className="flex items-baseline justify-center sm:justify-start gap-2">
                <span className="text-4xl sm:text-5xl font-black tracking-tight">{pct}%</span>
                <span className="text-sm font-semibold text-slate-300">
                  ({rawScore} pts scored)
                </span>
              </div>
              <p className="text-xs text-slate-300 font-normal">
                {pct >= 70
                  ? "Proficient & Job-Ready: Demonstrates strong technical grasp across key competencies."
                  : pct >= 50
                  ? "Intermediate Competence: Solid fundamentals with targeted room for advanced growth."
                  : "Foundational Level: Guided upskilling recommended to master workplace data workflows."}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 text-center w-full sm:w-auto">
              <div className="flex flex-col items-center">
                <span className="font-bold text-slate-300 uppercase text-[10px]">Correct Answers</span>
                <span className="text-sm sm:text-base font-black text-white mt-0.5">
                  {correctCount} / {totalQuestions}
                </span>
              </div>
              <div className="flex flex-col items-center border-x border-white/10 px-3">
                <span className="font-bold text-slate-300 uppercase text-[10px]">Time Taken</span>
                <span className="text-sm sm:text-base font-black text-white mt-0.5">
                  {Math.round((attempt.timeTakenSecs ?? 0) / 60)} mins
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-slate-300 uppercase text-[10px]">Integrity Audit</span>
                <span className={`text-sm sm:text-base font-black mt-0.5 ${violationsCount === 0 ? "text-emerald-400" : "text-amber-300"}`}>
                  {violationsCount === 0 ? "Verified Clean" : `${violationsCount} Flags`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Competency Category Breakdown */}
        {Object.keys(categoryScores).length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-base sm:text-lg font-bold text-[#0f172a] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1d4ed8]" />
              Competency Breakdown
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(categoryScores).map(([cat, scoreVal]) => {
                const scoreNumber =
                  typeof scoreVal === "number"
                    ? Math.round(scoreVal)
                    : typeof scoreVal === "object" && scoreVal !== null
                    ? Math.round(scoreVal.pct ?? 0)
                    : 0;

                return (
                  <div key={cat} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700">{cat}</span>
                      <span className="text-slate-900 font-mono">{scoreNumber}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          scoreNumber >= 70 ? "bg-emerald-500" : scoreNumber >= 50 ? "bg-[#1d4ed8]" : "bg-rose-500"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, scoreNumber))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Diagnostic Report */}
        {aiDiagnostic && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-[#1d4ed8] border border-blue-100">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#0f172a]">
                  {aiDiagnostic.headline || "Diagnostic Performance Feedback"}
                </h2>
                <p className="text-xs text-slate-500 font-medium">Personalized AI Capability Diagnostic</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              {aiDiagnostic.summary}
            </p>

            {/* Strengths & Weaknesses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Strengths */}
              <div className="p-5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  Key Strengths
                </h3>
                <ul className="space-y-2 text-xs text-emerald-950 font-medium leading-relaxed">
                  {(aiDiagnostic.strengths || ["Demonstrated core analytical understanding"]).map((str: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">&bull;</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="p-5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  Identified Skill Gaps
                </h3>
                <ul className="space-y-2 text-xs text-amber-950 font-medium leading-relaxed">
                  {(aiDiagnostic.weaknesses || ["Advanced modeling and formula optimization"]).map((weak: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">&bull;</span>
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommended AidLearn Programmes */}
            {aiDiagnostic.recommendedCurriculum && aiDiagnostic.recommendedCurriculum.length > 0 && (
              <div className="p-5 sm:p-6 rounded-xl bg-blue-50/80 border border-blue-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#1d4ed8] shrink-0" />
                    Recommended AidLearn Analytics Programmes
                  </h3>
                  <a
                    href="https://aidlearnanalytics.com/pricing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1d4ed8] hover:underline"
                  >
                    View Curriculum &amp; Details <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {aiDiagnostic.recommendedCurriculum.map((curr: string, i: number) => {
                    const matchedInfo = AIDLEARN_OFFICIAL_COURSES.find(
                      (c) => curr.toLowerCase().includes(c.title.toLowerCase()) || curr.toLowerCase().includes(c.shortTitle.toLowerCase())
                    );

                    return (
                      <div key={i} className="p-4 bg-white rounded-xl border border-blue-200 text-xs shadow-sm space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#1d4ed8] shrink-0" />
                          <h4 className="font-extrabold text-slate-900">{curr}</h4>
                        </div>
                        {matchedInfo && (
                          <p className="text-[11px] text-slate-600 font-normal leading-relaxed pl-4">
                            {matchedInfo.focus}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {aiDiagnostic.learningActionPlan && (
                  <div className="pt-2 border-t border-blue-200/60">
                    <p className="text-xs text-blue-950 font-medium leading-relaxed">
                      <span className="font-bold text-[#1d4ed8]">Action Plan: </span>
                      {aiDiagnostic.learningActionPlan}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* CTA to Main Platform Pricing / Course Details */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-800 p-6 sm:p-10 text-white shadow-md text-center space-y-5">
          <div className="max-w-2xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Bridge Your Capability Gaps with AidLearn Analytics
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 font-normal leading-relaxed">
              Explore instructor-led masterclasses, practical projects, and industry certifications tailored for modern workplace analytics.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://aidlearnanalytics.com/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-[#1d4ed8] font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-blue-50 transition-all cursor-pointer"
            >
              Explore Course Catalog <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
