import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(["SUPER_ADMIN", "COMPANY_ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const questionId: string | undefined = body?.questionId;
  if (!questionId) return NextResponse.json({ error: "questionId is required" }, { status: 400 });

  const question = await db.question.findUnique({ where: { id: questionId } });
  if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });
  if (question.status !== "APPROVED") {
    return NextResponse.json({ error: "Only approved questions can be added to an assessment" }, { status: 409 });
  }

  const count = await db.assessmentQuestion.count({ where: { assessmentId: params.id } });

  const link = await db.assessmentQuestion.create({
    data: { assessmentId: params.id, questionId, order: count },
  });

  return NextResponse.json({ link }, { status: 201 });
}
