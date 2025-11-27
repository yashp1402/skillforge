// src/app/api/jobs/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { z, ZodError } from "zod";

const prisma = new PrismaClient();

const jobSchema = z.object({
  title: z.string().min(1),
  company: z.string().optional(),
  description: z.string().min(1),
  seniority: z.string().optional(),
});

const deleteSchema = z.object({
  id: z.string().min(1),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const jobs = await prisma.jobTarget.findMany({
      where: { userId: session.user.id },
    //   orderBy: { createdAt: "desc" }, // add createdAt to model if you want
    });

    return NextResponse.json(jobs);
  } catch (err) {
    console.error("GET /api/jobs error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const data = jobSchema.parse(json);

    const created = await prisma.jobTarget.create({
      data: {
        title: data.title,
        company: data.company ?? null,
        description: data.description,
        seniority: data.seniority ?? null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/jobs error", err);
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid data" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const { id } = deleteSchema.parse(json);

    const job = await prisma.jobTarget.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!job) {
      return NextResponse.json({ error: "job not found" }, { status: 404 });
    }

    // delete required skills first to avoid FK issues
    await prisma.jobRequiredSkill.deleteMany({
      where: { jobId: job.id },
    });

    await prisma.jobTarget.delete({
      where: { id: job.id },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/jobs error", err);
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}