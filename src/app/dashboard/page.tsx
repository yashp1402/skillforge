// src/app/dashboard/page.tsx
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

const prisma = new PrismaClient();

type GoalStatus = "PLANNED" | "IN_PROGRESS" | "DONE";
type AppStatus =
  | "APPLIED"
  | "ONLINE_ASSESSMENT"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED";

function goalStatusStyles(
  status: GoalStatus
): { label: string; className: string } {
  switch (status) {
    case "PLANNED":
      return {
        label: "Planned",
        className: "bg-sky-100 text-sky-700 border-sky-200",
      };
    case "IN_PROGRESS":
      return {
        label: "In progress",
        className: "bg-amber-100 text-amber-700 border-amber-200",
      };
    case "DONE":
      return {
        label: "Done",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      };
    default:
      return {
        label: status,
        className: "bg-gray-100 text-gray-700 border-gray-200",
      };
  }
}

function appStatusStyles(
  status: AppStatus
): { label: string; className: string } {
  switch (status) {
    case "APPLIED":
      return {
        label: "Applied",
        className: "bg-sky-100 text-sky-700 border-sky-200",
      };
    case "ONLINE_ASSESSMENT":
      return {
        label: "Online assessment",
        className: "bg-purple-100 text-purple-700 border-purple-200",
      };
    case "INTERVIEW":
      return {
        label: "Interview",
        className: "bg-amber-100 text-amber-700 border-amber-200",
      };
    case "OFFER":
      return {
        label: "Offer",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      };
    case "REJECTED":
      return {
        label: "Rejected",
        className: "bg-rose-100 text-rose-700 border-rose-200",
      };
    default:
      return {
        label: status,
        className: "bg-gray-100 text-gray-700 border-gray-200",
      };
  }
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/sign-in");
  }

  const userId = session.user.id;
  const name = session.user.name ?? session.user.email ?? "there";

  const [
    skillsCount,
    jobsCount,
    openGoalsCount,
    applicationsCount,
    recentJobs,
    recentGoals,
    recentApps,
  ] = await Promise.all([
    prisma.skill.count({ where: { userId } }),
    prisma.jobTarget.count({ where: { userId } }),
    prisma.learningGoal.count({
      where: { userId, NOT: { status: "DONE" } },
    }),
    prisma.jobApplication.count({ where: { userId } }),
    prisma.jobTarget.findMany({
      where: { userId },
      orderBy: { id: "desc" },
      take: 3,
    }),
    prisma.learningGoal.findMany({
      where: { userId },
      orderBy: { id: "desc" },
      take: 3,
    }),
    prisma.jobApplication.findMany({
      where: { userId },
      orderBy: { appliedAt: "desc" },
      take: 3,
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Welcome back, {name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            This is your SkillForge overview. Track your skills, job targets,
            learning goals and applications in one place.
          </p>
        </CardContent>
      </Card>

      {/* Metrics row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{skillsCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              in your profile
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Job targets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{jobsCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              pasted from JDs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Open goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{openGoalsCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              learning items in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{applicationsCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              tracked so far
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two-column: jobs + goals/applications */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent job targets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent job targets</CardTitle>
            <Link
              href="/jobs"
              className="text-xs font-medium text-muted-foreground hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {recentJobs.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No job targets yet. Create one from the{" "}
                <Link href="/jobs/new" className="underline">
                  Jobs
                </Link>{" "}
                page.
              </p>
            ) : (
              <ul className="space-y-2">
                {recentJobs.map((job) => (
                  <li
                    key={job.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.company ?? "Unknown company"}
                        {job.seniority ? ` • ${job.seniority}` : ""}
                      </p>
                    </div>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-xs font-medium underline"
                    >
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Goals + applications snapshot */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent goals</CardTitle>
              <Link
                href="/goals"
                className="text-xs font-medium text-muted-foreground hover:underline"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {recentGoals.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No learning goals yet. Add one on the{" "}
                  <Link href="/goals" className="underline">
                    Goals
                  </Link>{" "}
                  page.
                </p>
              ) : (
                <ul className="space-y-2">
                  {recentGoals.map((g) => {
                    const styles = goalStatusStyles(g.status as GoalStatus);
                    return (
                      <li
                        key={g.id}
                        className="rounded-md border px-3 py-2 flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-medium">{g.title}</p>
                          {g.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs">
                              {g.description}
                            </p>
                          )}
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${styles.className}`}
                        >
                          {styles.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent applications</CardTitle>
              <Link
                href="/applications"
                className="text-xs font-medium text-muted-foreground hover:underline"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {recentApps.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No applications tracked yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {recentApps.map((a) => {
                    const styles = appStatusStyles(a.status as AppStatus);
                    return (
                      <li
                        key={a.id}
                        className="rounded-md border px-3 py-2 flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-medium">
                            {a.company} – {a.role}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Applied{" "}
                            {new Date(a.appliedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${styles.className}`}
                        >
                          {styles.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
