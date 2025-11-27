// src/app/api/applications/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z, ZodError } from "zod";
import { auth } from "@/auth";

const prisma = new PrismaClient();

const schema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  status: z
    .enum(["APPLIED", "ONLINE_ASSESSMENT", "INTERVIEW", "OFFER", "REJECTED"])
    .optional(),
  link: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
});

const deleteSchema = z.object({
  id: z.string().min(1),
});

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum([
    "APPLIED",
    "ONLINE_ASSESSMENT",
    "INTERVIEW",
    "OFFER",
    "REJECTED",
  ]),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const apps = await prisma.jobApplication.findMany({
    where: { userId: session.user.id },
    orderBy: { appliedAt: "desc" },
  });

  return NextResponse.json(apps);
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const data = schema.parse(json);

    const created = await prisma.jobApplication.create({
      data: {
        company: data.company,
        role: data.role,
        status: data.status ?? "APPLIED",
        link: data.link || null,
        notes: data.notes ?? null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/applications error", err);
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          error:
            "Invalid data. If you provide a link, it must be a full URL like https://example.com",
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/applications  { id, status }
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const data = updateSchema.parse(json);

    const app = await prisma.jobApplication.findFirst({
      where: { id: data.id, userId: session.user.id },
    });

    if (!app) {
      return NextResponse.json({ error: "application not found" }, { status: 404 });
    }

    const updated = await prisma.jobApplication.update({
      where: { id: app.id },
      data: { status: data.status },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/applications error", err);
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

    const app = await prisma.jobApplication.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!app) {
      return NextResponse.json(
        { error: "application not found" },
        { status: 404 },
      );
    }

    await prisma.jobApplication.delete({ where: { id: app.id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/applications error", err);
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}