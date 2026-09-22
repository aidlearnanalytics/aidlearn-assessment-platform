import QuestionForm from "@/components/admin/QuestionForm";

export default function NewQuestionPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">New question</h1>
      <p className="mb-6 text-sm text-ink/60">
        Saved as a draft first. Submit it for approval once you're happy with it.
      </p>
      <QuestionForm />
    </div>
  );
}
