// src/app/api/goals/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z, ZodError } from "zod";
import { auth } from "@/auth";

const prisma = new PrismaClient();

const goalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "DONE"]).optional(),
});

const deleteSchema = z.object({
  id: z.string().min(1),
});

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["PLANNED", "IN_PROGRESS", "DONE"]),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const goals = await prisma.learningGoal.findMany({
    where: { userId: session.user.id },
    // orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(goals);
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const data = goalSchema.parse(json);

    const created = await prisma.learningGoal.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        status: data.status ?? "PLANNED",
        userId: session.user.id,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/goals error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/goals  { id, status }
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const data = updateSchema.parse(json);

    // make sure goal belongs to user
    const goal = await prisma.learningGoal.findFirst({
      where: { id: data.id, userId: session.user.id },
    });

    if (!goal) {
      return NextResponse.json({ error: "goal not found" }, { status: 404 });
    }

    const updated = await prisma.learningGoal.update({
      where: { id: goal.id },
      data: { status: data.status },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/goals error", err);
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
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

    const goal = await prisma.learningGoal.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!goal) {
      return NextResponse.json({ error: "goal not found" }, { status: 404 });
    }

    await prisma.learningGoal.delete({ where: { id: goal.id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/goals error", err);
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}