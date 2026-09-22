import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { findOrCreateSkill, findOrCreateCategory } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "COMPANY_ADMIN", "REVIEWER"];

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireRole(ADMIN_ROLES);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { companyId, prompt, type, options, explanation, difficulty, points, skillName } = body;

    if (!prompt || !companyId) {
      return NextResponse.json({ error: "Prompt and Company ID are required." }, { status: 400 });
    }

    const skill = await findOrCreateSkill(skillName || "General");

    // Format options
    let formattedOptions = undefined;
    let correctAnswer = undefined;
    if (options && Array.isArray(options)) {
      formattedOptions = JSON.stringify(options);
      const correct = options.find((o: any) => o.isCorrect);
      if (correct) correctAnswer = correct.key || correct.id;
    }

    const question = await db.question.create({
      data: {
        companyId,
        prompt,
        type: type || "MULTIPLE_CHOICE",
        options: formattedOptions,
        correctAnswer,
        explanation,
        difficulty: difficulty || "intermediate",
        points: Number(points) || 1,
        skillId: skill.id,
        source: "HUMAN",
        status: "APPROVED",
        createdById: (session.user as any).id,
        approvedById: (session.user as any).id,
        approvedAt: new Date(),
      },
    });

    // Link to company's assessment
    const assessment = await db.assessment.findFirst({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });

    if (assessment) {
      const highestOrder = await db.assessmentQuestion.aggregate({
        where: { assessmentId: assessment.id },
        _max: { order: true },
      });
      const nextOrder = (highestOrder._max.order ?? 0) + 1;

      await db.assessmentQuestion.create({
        data: {
          assessmentId: assessment.id,
          questionId: question.id,
          order: nextOrder,
        },
      });
    }

    return NextResponse.json({ question }, { status: 201 });
  } catch (err: any) {
    console.error("Create Question Error:", err);
    return NextResponse.json({ error: err.message || "Failed to create question" }, { status: 500 });
  }
}
