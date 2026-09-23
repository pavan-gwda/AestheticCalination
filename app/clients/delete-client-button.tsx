"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteClientButton({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (
      !window.confirm(
        `Delete ${clientName || "this client"}? This removes their PAR-Q, movement screen, and progression data too. This cannot be undone.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", clientId);
    if (error) {
      setDeleting(false);
      window.alert(`Could not delete client: ${error.message}`);
      return;
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      aria-label="Delete client"
      className="text-neutral-600 hover:text-red-400 transition disabled:opacity-50 p-1 -m-1"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-4 h-4"
      >
        <path
          fillRule="evenodd"
          d="M8.75 1a.75.75 0 0 0-.75.75V2h-3a.75.75 0 0 0 0 1.5h.813l.858 12.008A2.5 2.5 0 0 0 8.117 18h3.766a2.5 2.5 0 0 0 2.496-2.492L15.237 3.5h.813a.75.75 0 0 0 0-1.5h-3v-.25a.75.75 0 0 0-.75-.75h-2.5ZM10 6a.75.75 0 0 1 .75.75v6.5a.75.75 0 0 1-1.5 0v-6.5A.75.75 0 0 1 10 6Zm-2.75.75a.75.75 0 0 0-1.5 0v6.5a.75.75 0 0 0 1.5 0v-6.5Zm5.5 0a.75.75 0 0 0-1.5 0v6.5a.75.75 0 0 0 1.5 0v-6.5Z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}
