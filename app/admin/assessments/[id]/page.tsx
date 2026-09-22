import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import AssessmentQuestionManager from "@/components/admin/AssessmentQuestionManager";

export default async function AssessmentDetailPage({ params }: { params: { id: string } }) {
  const assessment = await db.assessment.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      questions: { include: { question: { include: { skill: true } } }, orderBy: { order: "asc" } },
      _count: { select: { attempts: true } },
    },
  });
  if (!assessment) notFound();

  const attachedIds = assessment.questions.map((aq) => aq.questionId);
  const available = await db.question.findMany({
    where: { status: "APPROVED", id: { notIn: attachedIds } },
    include: { skill: true },
    take: 50,
  });

  return (
    <div>
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{assessment.name}</h1>
        <span
          className={
            assessment.isPublished
              ? "rounded bg-accentSoft px-2 py-0.5 text-xs text-accent"
              : "rounded bg-ink/10 px-2 py-0.5 text-xs text-ink/60"
          }
        >
          {assessment.isPublished ? "Published" : "Draft"}
        </span>
      </div>
      <p className="mb-6 text-sm text-ink/60">{assessment.company.name}</p>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Duration" value={`${assessment.durationMinutes} min`} />
        <Stat label="Questions needed" value={String(assessment.numQuestions)} />
        <Stat label="Passing score" value={assessment.passingScorePct ? `${assessment.passingScorePct}%` : "—"} />
        <Stat label="Attempts so far" value={String(assessment._count.attempts)} />
      </div>

      <div className="mb-6 flex flex-wrap gap-2 text-xs text-ink/60">
        {assessment.randomizeQuestions && <Flag>Randomized questions</Flag>}
        {assessment.randomizeOptions && <Flag>Randomized options</Flag>}
        {assessment.requireScreenShare && <Flag>Screen share required</Flag>}
        {assessment.requireFullscreen && <Flag>Fullscreen required</Flag>}
        {assessment.monitorTabSwitch && <Flag>Tab-switch monitoring</Flag>}
        {assessment.monitorVisibility && <Flag>Visibility monitoring</Flag>}
      </div>

      <AssessmentQuestionManager
        assessmentId={assessment.id}
        numQuestions={assessment.numQuestions}
        isPublished={assessment.isPublished}
        attached={assessment.questions.map((aq) => ({
          linkId: aq.id,
          question: {
            id: aq.question.id,
            prompt: aq.question.prompt,
            skillName: aq.question.skill?.name,
            difficulty: aq.question.difficulty,
          },
        }))}
        available={available.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          skillName: q.skill?.name,
          difficulty: q.difficulty,
        }))}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded border border-ink/10 p-3 text-center">
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs text-ink/60">{label}</p>
    </div>
  );
}

function Flag({ children }: { children: React.ReactNode }) {
  return <span className="rounded bg-ink/5 px-2 py-1">{children}</span>;
}
