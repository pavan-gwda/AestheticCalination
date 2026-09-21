import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import AccountBar from "@/components/account-bar";
import EntryEditor from "./entry-editor";

export default async function EntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: entry } = await supabase
    .from("entries")
    .select("*, entry_days(*, metrics(*), photos(*), tags(*)), homework(*)")
    .eq("id", id)
    .single();

  if (!entry) notFound();

  const entryDays = (entry.entry_days ?? [])
    .slice()
    .sort((a: { day_date: string }, b: { day_date: string }) =>
      a.day_date.localeCompare(b.day_date),
    );

  // Generate signed URLs for private photos (1 hour expiry)
  for (const day of entryDays) {
    day.photos = await Promise.all(
      (day.photos ?? []).map(
        async (photo: {
          id: string;
          storage_path: string;
          caption: string | null;
        }) => {
          const { data } = await supabase.storage
            .from("journal-photos")
            .createSignedUrl(photo.storage_path, 3600);
          return { ...photo, url: data?.signedUrl };
        },
      ),
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {user?.email && <AccountBar email={user.email} />}

        <Link
          href="/"
          className="text-sm text-neutral-500 hover:text-neutral-300"
        >
          ← Back
        </Link>

        <EntryEditor
          entry={entry}
          entryDays={entryDays}
          homework={entry.homework ?? []}
          userId={user?.id ?? ""}
        />
      </div>
    </div>
  );
}
