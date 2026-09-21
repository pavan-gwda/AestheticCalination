import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import HomeworkList from "./homework-list";
import AccountBar from "@/components/account-bar";

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
    .select("*, metrics(*), photos(*), tags(*), homework(*)")
    .eq("id", id)
    .single();

  if (!entry) notFound();

  // Generate signed URLs for private photos (1 hour expiry)
  const photosWithUrls = await Promise.all(
    (entry.photos ?? []).map(
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

        <div className="mt-3 mb-6">
          <span className="text-sm text-neutral-400">
            Week of {format(new Date(entry.week_start), "MMM d, yyyy")}
          </span>
          {entry.title && (
            <h1 className="text-2xl font-semibold mt-1">{entry.title}</h1>
          )}
          {entry.summary && (
            <p className="text-neutral-300 mt-2">{entry.summary}</p>
          )}
        </div>

        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-6">
            {entry.tags.map((t: { id: string; label: string }) => (
              <span
                key={t.id}
                className="text-xs bg-neutral-800 text-neutral-300 rounded px-2 py-0.5"
              >
                {t.label}
              </span>
            ))}
          </div>
        )}

        {entry.notes && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-neutral-400 mb-2">Notes</h2>
            <p className="whitespace-pre-wrap text-neutral-200 text-sm leading-relaxed">
              {entry.notes}
            </p>
          </div>
        )}

        {entry.metrics && entry.metrics.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-neutral-400 mb-2">
              Metrics
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {entry.metrics.map(
                (m: {
                  id: string;
                  name: string;
                  value: number;
                  unit: string;
                }) => (
                  <div
                    key={m.id}
                    className="rounded-md border border-neutral-800 bg-neutral-900 p-3"
                  >
                    <div className="text-xs text-neutral-500">{m.name}</div>
                    <div className="text-lg font-medium">
                      {m.value}{" "}
                      <span className="text-xs text-neutral-500">{m.unit}</span>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {photosWithUrls.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-neutral-400 mb-2">
              Photos
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {photosWithUrls.map((p) =>
                p.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={p.id}
                    src={p.url}
                    alt={p.caption ?? "progress photo"}
                    className="rounded-md w-full aspect-square object-cover border border-neutral-800"
                  />
                ) : null,
              )}
            </div>
          </div>
        )}

        {entry.homework && entry.homework.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-neutral-400 mb-2">
              Homework
            </h2>
            <HomeworkList items={entry.homework} />
          </div>
        )}
      </div>
    </div>
  );
}
