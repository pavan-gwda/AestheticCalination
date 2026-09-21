"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100">
      <div className="w-full max-w-sm p-8">
        <h1 className="text-2xl font-semibold mb-1">Cali Journal</h1>
        <p className="text-neutral-400 mb-6 text-sm">
          Sign in with a magic link — no password needed.
        </p>

        {sent ? (
          <p className="text-sm text-green-400">
            Check your email for a login link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
            <button
              type="submit"
              className="w-full rounded-md bg-neutral-100 text-neutral-900 py-2 text-sm font-medium hover:bg-white transition"
            >
              Send magic link
            </button>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
