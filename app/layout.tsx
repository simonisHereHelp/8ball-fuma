import "./global.css";
import { RootProvider } from "fumadocs-ui/provider";
import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Link from "next/link";
import { auth } from "@/auth";
import { AuthSessionProvider } from "@/components/auth-session-provider";
import { BagelLogo } from "@/lib/drive-active-subfolder-list";

export default async function Layout({ children }: { children: ReactNode }) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        <AuthSessionProvider session={session}>
          <RootProvider>
            <header className="flex items-center justify-center px-6 py-4">
              <Link href="/" className="inline-flex items-center">
                <BagelLogo />
              </Link>
            </header>
            {children}
          </RootProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
