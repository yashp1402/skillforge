// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "SkillForge",
  description: "Career roadmap & job-fit planner",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur px-6 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <Link href="/dashboard" className="font-semibold tracking-tight">
                  SkillForge
                </Link>
                <nav className="flex gap-4 text-sm text-muted-foreground">
                  <Link href="/dashboard">Dashboard</Link>
                  <Link href="/skills">Skills</Link>
                  <Link href="/jobs">Jobs</Link>
                  <Link href="/goals">Goals</Link>
                  <Link href="/applications">Applications</Link>
                </nav>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <ThemeToggle />
                {session?.user ? (
                  <>
                    <span className="text-muted-foreground">
                      {session.user.name ?? session.user.email}
                    </span>
                    <form
                      action={async () => {
                        "use server";
                        await signOut({ redirectTo: "/auth/sign-in" });
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-md border px-3 py-1 text-xs hover:bg-accent"
                      >
                        Sign out
                      </button>
                    </form>
                  </>
                ) : (
                  <Link
                    href="/auth/sign-in"
                    className="rounded-md border px-3 py-1 text-xs hover:bg-accent"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </header>

            <main className="flex-1 px-6 py-4 max-w-5xl mx-auto w-full">
              {children}
            </main>
          </div>
        </ThemeProvider>

      </body>
    </html>
  );
}
