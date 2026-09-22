import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(["SUPER_ADMIN", "COMPANY_ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const assessment = await db.assessment.findUnique({
    where: { id: params.id },
    include: { questions: true },
  });
  if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (assessment.questions.length < assessment.numQuestions) {
    return NextResponse.json(
      {
        error: `This assessment needs ${assessment.numQuestions} questions attached but only has ${assessment.questions.length}. Add more approved questions before publishing.`,
      },
      { status: 409 }
    );
  }

  const updated = await db.assessment.update({
    where: { id: params.id },
    data: { isPublished: true, publishedAt: new Date() },
  });

  return NextResponse.json({ assessment: updated });
}
