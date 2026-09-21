import { signOut } from "@/lib/actions/auth";

export default function AccountBar({ email }: { email: string }) {
  return (
    <div className="flex items-center justify-between mb-6 -mt-2">
      <span className="text-sm text-neutral-500 truncate">{email}</span>
      <form action={signOut}>
        <button
          type="submit"
          className="text-sm text-neutral-500 hover:text-neutral-200 transition"
        >
          Log out
        </button>
      </form>
    </div>
  );
}
