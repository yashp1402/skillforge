// src/app/api/skills/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { z, ZodError } from "zod";

const prisma = new PrismaClient();

const skillSchema = z.object({
  name: z.string().min(1),
  level: z.coerce.number().min(1).max(5),
  category: z.string().optional(),
});

const deleteSchema = z.object({
  id: z.string().min(1),
});

// GET /api/skills  → list current user's skills
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const skills = await prisma.skill.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(skills);
  } catch (err) {
    console.error("GET /api/skills error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/skills  → create a new skill
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const data = skillSchema.parse(json);

    const created = await prisma.skill.create({
      data: {
        name: data.name,
        level: data.level,
        category: data.category ?? null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/skills error", err);
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

    const skill = await prisma.skill.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!skill) {
      return NextResponse.json({ error: "skill not found" }, { status: 404 });
    }

    await prisma.skill.delete({ where: { id: skill.id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/skills error", err);
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}