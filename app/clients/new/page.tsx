"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AccountBar from "@/components/account-bar";

export default function NewClientPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not signed in.");
      setSaving(false);
      return;
    }

    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .insert({
        user_id: user.id,
        name,
        email: email || null,
        phone: phone || null,
      })
      .select()
      .single();

    setSaving(false);

    if (clientErr || !client) {
      setError(clientErr?.message ?? "Could not create client.");
      return;
    }

    router.push(`/clients/${client.id}`);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {userEmail && <AccountBar email={userEmail} />}

        <h1 className="text-2xl font-semibold mb-1">New client</h1>
        <p className="text-neutral-400 text-sm mb-6">
          Add PAR-Q and progression details after creating the client.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Client's full name"
              className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1">
              Email (optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1">
              Phone (optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-neutral-100 text-neutral-900 py-2.5 text-sm font-medium hover:bg-white transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Create client"}
          </button>
        </form>
      </div>
    </div>
  );
}
