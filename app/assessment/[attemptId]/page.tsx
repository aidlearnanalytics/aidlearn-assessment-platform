import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import AssessmentPlayer from "@/components/candidate/AssessmentPlayer";

export const dynamic = "force-dynamic";

export default async function AssessmentAttemptPage({
  params,
}: {
  params: { attemptId: string };
}) {
  const attempt = await db.assessmentAttempt.findUnique({
    where: { id: params.attemptId },
    include: {
      participant: { include: { company: true } },
      assessment: {
        include: {
          questions: {
            include: {
              question: {
                include: { skill: true, category: true },
              },
            },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!attempt) {
    notFound();
  }

  // If already submitted or terminated, redirect to results
  if (attempt.status === "SUBMITTED" || attempt.status === "TERMINATED") {
    redirect(`/results/${attempt.id}`);
  }

  // Format questions safely (strip correct answers for security during exam)
  let rawQuestions = attempt.assessment.questions.map((aq) => {
    const q = aq.question;
    let parsedOptions: Array<{ id: string; text: string; key?: string }> = [];
    if (q.options) {
      try {
        const raw = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
        parsedOptions = Array.isArray(raw)
          ? raw.map((o: any, i: number) => ({
              id: String(o.id || o.key || String.fromCharCode(65 + i)),
              key: String(o.key || o.id || String.fromCharCode(65 + i)),
              text: String(o.text),
            }))
          : [];
      } catch {
        parsedOptions = [];
      }
    }

    return {
      id: q.id,
      prompt: q.prompt,
      type: q.type,
      options: parsedOptions,
      difficulty: q.difficulty,
      points: aq.pointsOverride ?? q.points,
      skillName: q.skill?.name,
      categoryName: q.category?.name,
    };
  });

  if (rawQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full shadow-sm">
          <h3 className="text-base font-bold text-[#0f172a] mb-2">No Questions Published</h3>
          <p className="text-xs text-slate-500 mb-6">
            This assessment currently has no questions assigned. Please contact your company administrator.
          </p>
          <a
            href="/"
            className="inline-flex px-4 py-2 rounded-xl bg-[#1d4ed8] text-white text-xs font-bold"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <AssessmentPlayer
      attemptId={attempt.id}
      assessmentName={attempt.assessment.name}
      companyName={attempt.participant.company.name}
      candidateName={attempt.participant.fullName}
      department={attempt.participant.department}
      durationMinutes={attempt.assessment.durationMinutes}
      maxViolations={attempt.assessment.maxViolations}
      requireFullscreen={attempt.assessment.requireFullscreen}
      monitorTabSwitch={attempt.assessment.monitorTabSwitch}
      questions={rawQuestions}
      initialStartedAt={attempt.startedAt ? attempt.startedAt.toISOString() : null}
    />
  );
}
