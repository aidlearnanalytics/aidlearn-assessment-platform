import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { questionInputSchema } from "@/lib/validations/question";
import { findOrCreateSkill, findOrCreateCategory } from "@/lib/taxonomy";

const ADMIN_ROLES = ["SUPER_ADMIN", "COMPANY_ADMIN", "REVIEWER"];

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(ADMIN_ROLES);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const question = await db.question.findUnique({
    where: { id: params.id },
    include: { skill: true, category: true },
  });
  if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ question });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(ADMIN_ROLES);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.question.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status === "APPROVED") {
    return NextResponse.json(
      { error: "Approved questions can't be edited directly. Reject it first, then edit." },
      { status: 409 }
    );
  }

  const body = await req.json();
  const parsed = questionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const skill = await findOrCreateSkill(data.skillName);
  const category = await findOrCreateCategory(data.categoryName);

  const question = await db.question.update({
    where: { id: params.id },
    data: {
      prompt: data.prompt,
      type: data.type,
      options: data.options ?? undefined,
      correctAnswer: data.correctAnswer,
      explanation: data.explanation,
      difficulty: data.difficulty,
      industry: data.industry,
      points: data.points,
      skillId: skill.id,
      categoryId: category?.id,
      // Editing a rejected question sends it back to draft rather than silently resubmitting it.
      status: existing.status === "REJECTED" ? "DRAFT" : existing.status,
    },
  });

  return NextResponse.json({ question });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(["SUPER_ADMIN", "COMPANY_ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.question.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
