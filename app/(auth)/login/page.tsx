"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (res?.error) {
      setError("Wrong email or password.");
      return;
    }
    router.push("/admin/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <p className="mb-1 text-sm font-semibold text-accent">AidLearn Analytics</p>
      <h1 className="mb-6 text-2xl font-semibold">Admin sign in</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-ink/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border border-ink/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        {error && <p className="text-sm text-warn">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-accent px-4 py-2 text-paper disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
