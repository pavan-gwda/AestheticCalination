import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AccountBar from "@/components/account-bar";
import { format } from "date-fns";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: entries } = await supabase
    .from("entries")
    .select("id, week_start, title, summary, tags(label), homework(id, done)")
    .order("week_start", { ascending: false });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Cali Journal</h1>
          <Link
            href="/entries/new"
            className="rounded-md bg-neutral-100 text-neutral-900 px-4 py-2 text-sm font-medium hover:bg-white transition"
          >
            + New week
          </Link>
        </div>

        {user?.email && <AccountBar email={user.email} />}

        {!entries || entries.length === 0 ? (
          <p className="text-neutral-500 text-sm">
            No entries yet. Log your first week to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const openHomework =
                entry.homework?.filter((h) => !h.done).length ?? 0;
              return (
                <Link
                  key={entry.id}
                  href={`/entries/${entry.id}`}
                  className="block rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-600 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">
                      Week of{" "}
                      {format(new Date(entry.week_start), "MMM d, yyyy")}
                    </span>
                    {openHomework > 0 && (
                      <span className="text-xs rounded-full bg-amber-900/40 text-amber-300 px-2 py-0.5">
                        {openHomework} homework
                      </span>
                    )}
                  </div>
                  {entry.title && (
                    <h2 className="text-lg font-medium mt-1">{entry.title}</h2>
                  )}
                  {entry.summary && (
                    <p className="text-neutral-400 text-sm mt-1 line-clamp-2">
                      {entry.summary}
                    </p>
                  )}
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.tags.map((t, i: number) => (
                        <span
                          key={i}
                          className="text-xs bg-neutral-800 text-neutral-300 rounded px-2 py-0.5"
                        >
                          {t.label}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
