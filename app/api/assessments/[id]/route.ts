export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { assessmentInputSchema } from "@/lib/validations/assessment";

const ADMIN_ROLES = ["SUPER_ADMIN", "COMPANY_ADMIN"];

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(ADMIN_ROLES);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const assessment = await db.assessment.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      questions: { include: { question: true }, orderBy: { order: "asc" } },
      _count: { select: { attempts: true } },
    },
  });
  if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ assessment });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(ADMIN_ROLES);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.assessment.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = assessmentInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const assessment = await db.assessment.update({
    where: { id: params.id },
    data: {
      name: data.name,
      companyId: data.companyId,
      description: data.description,
      durationMinutes: data.durationMinutes,
      numQuestions: data.numQuestions,
      categories: data.categories ? JSON.stringify(data.categories) : undefined,
      randomizeQuestions: data.randomizeQuestions,
      randomizeOptions: data.randomizeOptions,
      requireScreenShare: data.requireScreenShare,
      requireFullscreen: data.requireFullscreen,
      monitorTabSwitch: data.monitorTabSwitch,
      monitorVisibility: data.monitorVisibility,
      maxViolations: data.maxViolations,
      passingScorePct: data.passingScorePct,
    },
  });

  return NextResponse.json({ assessment });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(["SUPER_ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.assessment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
