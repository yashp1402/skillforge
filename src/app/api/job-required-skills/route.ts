// src/app/api/job-required-skills/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";

const prisma = new PrismaClient();

const schema = z.object({
  jobId: z.string().min(1),
  name: z.string().min(1),
  importance: z.coerce.number().min(1).max(5),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const data = schema.parse(json);

    // Make sure the job belongs to current user
    const job = await prisma.jobTarget.findFirst({
      where: { id: data.jobId, userId: session.user.id },
    });

    if (!job) {
      return NextResponse.json({ error: "job not found" }, { status: 404 });
    }

    const created = await prisma.jobRequiredSkill.create({
      data: {
        name: data.name,
        importance: data.importance,
        jobId: job.id,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/job-required-skills error", err);
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
