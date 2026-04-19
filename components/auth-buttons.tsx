"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import type { Session } from "next-auth";

type AppSession = Session & {
  AccessToken?: string | null;
  accessToken?: string | null;
  accessTokenExpires?: number | null;
  tokenError?: string;
};

export function AuthButtons() {
  const { data, status, update } = useSession();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const hasRefreshed = useRef(false);

  const session = data as AppSession | null;
  const displayName =
    session?.user?.name ?? session?.user?.email ?? "Google user";
  const hasAccessToken = Boolean(session?.accessToken ?? session?.AccessToken);
  const needsSignInAgain = Boolean(session?.tokenError);

  useEffect(() => {
    if (status !== "authenticated" || hasRefreshed.current) {
      return;
    }

    hasRefreshed.current = true;
    setIsRefreshing(true);

    void update()
      .then((nextSession) => {
        const refreshed = nextSession as AppSession | null;

        if (!refreshed || refreshed.tokenError) {
          setRefreshMessage("Session refresh failed. Please sign in again.");
          return;
        }

        setRefreshMessage(null);
      })
      .catch((error) => {
        console.error("Failed to refresh session on landing page.", error);
        setRefreshMessage("Session refresh failed. Please sign in again.");
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  }, [status, update]);

  const tokenStatus = needsSignInAgain
    ? "Refresh failed"
    : isRefreshing
      ? "Refreshing"
      : hasAccessToken
        ? "Ready"
        : status === "authenticated"
          ? "Missing"
          : "Signed out";

  if (status === "authenticated") {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
        <div className="w-full rounded-2xl border border-fd-border bg-fd-card px-5 py-4 text-left shadow-sm">
          <p className="text-sm text-fd-muted-foreground">Signed in as</p>
          <p className="text-base font-semibold text-fd-foreground">
            {displayName}
          </p>
          <p className="mt-2 text-sm text-fd-muted-foreground">
            Token status:{" "}
            <span className="font-medium text-fd-foreground">{tokenStatus}</span>
          </p>
          {refreshMessage ? (
            <p className="mt-3 text-sm font-medium text-red-600">
              {refreshMessage}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {needsSignInAgain ? (
            <button
              type="button"
              onClick={() => signIn("google", { redirectTo: "/" })}
              className="rounded-full bg-fd-primary px-6 py-2.5 text-sm font-medium text-fd-primary-foreground"
            >
              Sign in again
            </button>
          ) : (
            <Link
              href="/docs/pages"
              className="inline-flex items-center justify-center rounded-full border border-fd-border px-4 py-2 text-sm font-medium text-fd-foreground transition-colors hover:border-fd-accent hover:text-fd-accent-foreground"
            >
              View docs
            </Link>
          )}

          <button
            type="button"
            onClick={() => signOut({ redirectTo: "/" })}
            className="rounded-full border px-6 py-2.5 text-sm font-medium"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
      <div className="w-full rounded-2xl border border-fd-border bg-fd-card px-5 py-4 text-left shadow-sm">
        <p className="text-sm text-fd-muted-foreground">Signed in as</p>
        <p className="text-base font-semibold text-fd-foreground">
          Not signed in
        </p>
        <p className="mt-2 text-sm text-fd-muted-foreground">
          Token status:{" "}
          <span className="font-medium text-fd-foreground">{tokenStatus}</span>
        </p>
      </div>

      <button
        type="button"
        onClick={() => signIn("google", { redirectTo: "/" })}
        className="rounded-full bg-fd-primary px-6 py-2.5 text-sm font-medium text-fd-primary-foreground"
      >
        Sign in with Google
      </button>
    </div>
  );
}
