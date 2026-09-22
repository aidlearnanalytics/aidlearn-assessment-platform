import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6">
      <p className="text-sm uppercase tracking-wide text-accent">AidLearn Analytics</p>
      <h1 className="text-4xl font-semibold leading-tight">
        Test real skills, not resumes.
      </h1>
      <p className="max-w-xl text-ink/70">
        Build a branded skills assessment for your company, populate it with human-reviewed
        and AI-generated questions, and get category-level scores the moment a candidate submits.
      </p>
      <div className="flex gap-3">
        <Link href="/login" className="rounded bg-accent px-5 py-2.5 text-paper">
          Admin sign in
        </Link>
      </div>
    </main>
  );
}
