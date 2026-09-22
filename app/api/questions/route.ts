import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { questionInputSchema } from "@/lib/validations/question";
import { findOrCreateSkill, findOrCreateCategory } from "@/lib/taxonomy";

const ADMIN_ROLES = ["SUPER_ADMIN", "COMPANY_ADMIN", "REVIEWER"];

export async function GET(req: NextRequest) {
  try {
    await requireRole(ADMIN_ROLES);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const status = params.get("status") ?? undefined;
  const skillId = params.get("skillId") ?? undefined;
  const difficulty = params.get("difficulty") ?? undefined;
  const industry = params.get("industry") ?? undefined;
  const assessmentId = params.get("assessmentId") ?? undefined;

  const questions = await db.question.findMany({
    where: {
      status: status ? (status as any) : undefined,
      skillId: skillId || undefined,
      difficulty: difficulty || undefined,
      industry: industry || undefined,
      assessmentQuestions: assessmentId ? { some: { assessmentId } } : undefined,
    },
    include: { skill: true, category: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ questions });
}

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireRole(ADMIN_ROLES);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = questionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const skill = await findOrCreateSkill(data.skillName);
  const category = await findOrCreateCategory(data.categoryName);

  const question = await db.question.create({
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
      source: "HUMAN",
      status: "DRAFT",
      createdById: (session.user as any).id,
    },
  });

  return NextResponse.json({ question }, { status: 201 });
}
