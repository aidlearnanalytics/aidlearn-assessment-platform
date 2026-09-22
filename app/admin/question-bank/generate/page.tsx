import Link from "next/link";

export default function GenerateQuestionsPage() {
  return (
    <div className="max-w-xl">
      <h1 className="mb-2 text-2xl font-semibold">AI question generation</h1>
      <p className="mb-4 text-ink/60">
        Not built yet — by design. Human question creation, editing, and the approval flow are
        working first, so the question bank still works if the AI provider changes later. Once
        you've created, submitted, and approved a few questions by hand, this is next.
      </p>
      <Link href="/admin/question-bank/new" className="rounded bg-accent px-4 py-2 text-sm text-paper">
        Create a question by hand instead
      </Link>
    </div>
  );
}
