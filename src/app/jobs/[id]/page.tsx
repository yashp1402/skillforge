// src/app/jobs/[id]/page.tsx
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import RequiredSkillsClient from "./RequiredSkillsClient";

const prisma = new PrismaClient();

type ParamsPromise = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailPage({ params }: ParamsPromise) {
  const { id } = await params; // unwrap promise

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/sign-in");
  }

  const job = await prisma.jobTarget.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      requiredSkills: true,
    },
  });

  if (!job) {
    notFound();
  }

  const skills = await prisma.skill.findMany({
    where: { userId: session.user.id },
  });

  const gaps = job.requiredSkills.map((req) => {
    const userSkill = skills.find(
      (s) => s.name.toLowerCase() === req.name.toLowerCase()
    );
    const userLevel = userSkill?.level ?? 0;
    const gap = req.importance - userLevel;

    return {
      id: req.id,
      name: req.name,
      importance: req.importance,
      userLevel,
      gap,
    };
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{job.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {job.company ?? "Unknown company"}
            {job.seniority ? ` • ${job.seniority}` : ""}
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Job description
            </p>
            <p className="whitespace-pre-wrap text-sm">{job.description}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gap analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {gaps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No required skills recorded yet for this job. Add them below to
              see a gap analysis.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {gaps.map((g) => {
                let badge =
                  "inline-flex rounded-full px-2 py-1 text-xs border";
                let label = "";

                if (g.gap <= 0) {
                  badge += " border-green-500 text-green-600";
                  label = "You meet or exceed this requirement";
                } else if (g.gap === 1 || g.gap === 2) {
                  badge += " border-yellow-500 text-yellow-600";
                  label = "Slight gap – focus soon";
                } else {
                  badge += " border-red-500 text-red-600";
                  label = "Big gap – high priority";
                }

                return (
                  <li
                    key={g.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div>
                      <p className="font-medium">{g.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Required level: {g.importance} • Your level:{" "}
                        {g.userLevel}
                      </p>
                    </div>
                    <span className={badge}>{label}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
      <RequiredSkillsClient jobId={job.id} />
    </div>
  );
}
