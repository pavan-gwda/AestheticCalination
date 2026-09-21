"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!signInError) {
      setPending(false);
      router.push("/");
      router.refresh();
      return;
    }

    // No account with this email/password combo yet — try creating one.
    // If the email is already registered, Supabase rejects this with
    // "User already registered", meaning the original failure above was
    // a wrong password for an existing account, not a missing one.
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email,
        password,
      },
    );

    setPending(false);

    if (signUpError) {
      setError(
        signUpError.message === "User already registered"
          ? "Wrong password."
          : signUpError.message,
      );
      return;
    }

    if (!signUpData.session) {
      setConfirmSent(true);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100">
      <div className="w-full max-w-sm p-8">
        <h1 className="text-2xl font-semibold mb-1">Cali Journal</h1>
        <p className="text-neutral-400 mb-6 text-sm">
          Sign in, or enter a new email + password to create an account.
        </p>

        {confirmSent ? (
          <p className="text-sm text-green-400">
            Check your email to confirm your new account, then sign in.
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
            <input
              type="password"
              required
              minLength={6}
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-md bg-neutral-100 text-neutral-900 py-2 text-sm font-medium hover:bg-white transition disabled:opacity-50"
            >
              {pending ? "Working..." : "Continue"}
            </button>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
