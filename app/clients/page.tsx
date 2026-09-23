import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AccountBar from "@/components/account-bar";
import DeleteClientButton from "./delete-client-button";

export default async function ClientsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, email, phone")
    .order("name", { ascending: true });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Practice</h1>
          <Link
            href="/clients/new"
            className="rounded-md bg-neutral-100 text-neutral-900 px-4 py-2 text-sm font-medium hover:bg-white transition"
          >
            + New client
          </Link>
        </div>

        {user?.email && <AccountBar email={user.email} />}

        <Link
          href="/"
          className="text-sm text-neutral-500 hover:text-neutral-300 block mb-6"
        >
          ← Journal
        </Link>

        {!clients || clients.length === 0 ? (
          <p className="text-neutral-500 text-sm">
            No clients yet. Add one to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {clients.map((client) => (
              <div
                key={client.id}
                className="relative rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-600 transition"
              >
                <Link
                  href={`/clients/${client.id}`}
                  className="absolute inset-0"
                  aria-label={client.name}
                />
                <div className="relative flex items-start justify-between gap-2 pointer-events-none">
                  <div>
                    <h2 className="text-lg font-medium">{client.name}</h2>
                    {(client.email || client.phone) && (
                      <p className="text-neutral-400 text-sm mt-1">
                        {[client.email, client.phone]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="pointer-events-auto">
                    <DeleteClientButton
                      clientId={client.id}
                      clientName={client.name}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
