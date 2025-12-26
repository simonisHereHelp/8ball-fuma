//components/auth-buttons.tsx

"use client";

import Link from "next/link";
import { signIn, signOut } from "next-auth/react";

export function AuthButtons({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {isAuthenticated ? (
        <>
          <Link
            href="/gallery"
            className="rounded-full bg-fd-primary px-6 py-2.5 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
          >
            Open Gallery
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-full border border-fd-border px-6 py-2.5 text-sm font-medium text-fd-muted-foreground transition-colors hover:border-fd-accent hover:text-fd-foreground"
          >
            Sign out
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/gallery" })}
          className="rounded-full bg-fd-primary px-6 py-2.5 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
        >
          Sign in with Google
        </button>
      )}
      <Link
        href="/docs"
        className="rounded-full border border-fd-border px-6 py-2.5 text-sm font-medium text-fd-muted-foreground transition-colors hover:border-fd-accent hover:text-fd-foreground"
      >
        View docs
      </Link>
    </div>
  );
}