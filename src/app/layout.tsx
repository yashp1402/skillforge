// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SkillForge",
  description: "Career roadmap & job-fit planner",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen flex-col">
          <header className="border-b px-6 py-3 flex items-center justify-between">
            <span className="font-semibold tracking-tight">SkillForge</span>
          </header>
          <main className="flex-1 px-6 py-4 max-w-5xl mx-auto w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}