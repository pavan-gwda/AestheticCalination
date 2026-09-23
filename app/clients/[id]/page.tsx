import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import AccountBar from "@/components/account-bar";
import ClientEditor from "./client-editor";

export default async function ClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: client } = await supabase
    .from("clients")
    .select(
      "*, parq_answers(*), movement_screens(*), movement_findings(*), client_metrics(*)",
    )
    .eq("id", id)
    .single();

  if (!client) notFound();

  const parq = Array.isArray(client.parq_answers)
    ? (client.parq_answers[0] ?? null)
    : client.parq_answers;

  const movementScreen = Array.isArray(client.movement_screens)
    ? (client.movement_screens[0] ?? null)
    : client.movement_screens;

  const clientMetrics = (client.client_metrics ?? [])
    .slice()
    .sort((a: { recorded_at: string }, b: { recorded_at: string }) =>
      b.recorded_at.localeCompare(a.recorded_at),
    );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {user?.email && <AccountBar email={user.email} />}

        <Link
          href="/clients"
          className="text-sm text-neutral-500 hover:text-neutral-300"
        >
          ← Practice
        </Link>

        <ClientEditor
          client={client}
          parq={parq}
          movementScreen={movementScreen}
          movementFindings={client.movement_findings ?? []}
          clientMetrics={clientMetrics}
        />
      </div>
    </div>
  );
}
