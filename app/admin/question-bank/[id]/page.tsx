import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import QuestionForm from "@/components/admin/QuestionForm";
import QuestionActions from "@/components/admin/QuestionActions";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-ink/10 text-ink/60",
  PENDING_APPROVAL: "bg-accentSoft text-accent",
  APPROVED: "bg-accentSoft text-accent",
  REJECTED: "bg-red-100 text-red-700",
  ARCHIVED: "bg-ink/10 text-ink/40",
};

export default async function QuestionDetailPage({ params }: { params: { id: string } }) {
  const question = await db.question.findUnique({
    where: { id: params.id },
    include: { skill: true, category: true, createdBy: true, approvedBy: true },
  });
  if (!question) notFound();

  const editable = question.status === "DRAFT" || question.status === "REJECTED";

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Question</h1>
        <span className={`rounded px-2 py-0.5 text-xs ${STATUS_STYLES[question.status]}`}>
          {question.status.replace("_", " ")}
        </span>
        <span className="text-xs text-ink/40">
          {question.source === "AI_GENERATED" ? "AI generated" : "Human"}
        </span>
      </div>

      <div className="mb-6">
        <QuestionActions id={question.id} status={question.status as any} />
      </div>

      {editable ? (
        <QuestionForm
          initial={{
            id: question.id,
            prompt: question.prompt,
            type: question.type as any,
            options: (question.options as any) ?? undefined,
            correctAnswer: question.correctAnswer ?? undefined,
            explanation: question.explanation ?? undefined,
            difficulty: question.difficulty,
            industry: question.industry ?? undefined,
            points: question.points,
            skillName: question.skill?.name ?? "",
            categoryName: question.category?.name ?? "",
          }}
        />
      ) : (
        <div className="max-w-2xl rounded border border-ink/10 p-4">
          <p className="mb-3 font-medium">{question.prompt}</p>
          {Array.isArray(question.options) && (
            <ul className="mb-3 flex flex-col gap-1 text-sm">
              {(question.options as any[]).map((o) => (
                <li key={o.id} className={o.isCorrect ? "font-medium text-accent" : "text-ink/70"}>
                  {o.isCorrect ? "✓ " : "· "}
                  {o.text}
                </li>
              ))}
            </ul>
          )}
          {question.correctAnswer && (
            <p className="mb-3 text-sm text-ink/70">
              Correct answer: <span className="font-medium text-accent">{question.correctAnswer}</span>
            </p>
          )}
          <p className="text-xs text-ink/40">
            {question.skill?.name ?? "—"} · {question.category?.name ?? "no category"} ·{" "}
            {question.difficulty} · {question.points} pt{question.points === 1 ? "" : "s"}
          </p>
          {question.approvedBy && (
            <p className="mt-2 text-xs text-ink/40">
              {question.status === "APPROVED" ? "Approved" : "Reviewed"} by {question.approvedBy.name}
            </p>
          )}
          <p className="mt-2 text-xs text-ink/40">
            Approved questions can't be edited directly — reject it to send it back to draft first.
          </p>
        </div>
      )}
    </div>
  );
}
