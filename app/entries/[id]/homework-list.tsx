"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type HomeworkItem = { id: string; description: string; done: boolean };

export default function HomeworkList({ items }: { items: HomeworkItem[] }) {
  const [homework, setHomework] = useState(items);

  async function toggle(id: string, done: boolean) {
    setHomework((prev) =>
      prev.map((h) => (h.id === id ? { ...h, done: !done } : h))
    );
    const supabase = createClient();
    await supabase.from("homework").update({ done: !done }).eq("id", id);
  }

  return (
    <div className="space-y-1.5">
      {homework.map((h) => (
        <label
          key={h.id}
          className="flex items-center gap-2 text-sm cursor-pointer"
        >
          <input
            type="checkbox"
            checked={h.done}
            onChange={() => toggle(h.id, h.done)}
            className="rounded border-neutral-700 bg-neutral-900"
          />
          <span className={h.done ? "line-through text-neutral-500" : "text-neutral-200"}>
            {h.description}
          </span>
        </label>
      ))}
    </div>
  );
}
