import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { QuestionType, QuestionStatus, QuestionSource } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const questions = await db.question.findMany({
      include: {
        skill: true,
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(questions);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      prompt,
      type = "MULTIPLE_CHOICE",
      options,
      correctAnswer,
      explanation,
      difficulty = "INTERMEDIATE",
      points = 1,
      skillId,
      categoryId,
      assessmentId,
      companyId,
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const question = await db.question.create({
      data: {
        prompt,
        type: (type as QuestionType) || "MULTIPLE_CHOICE",
        options: options || undefined,
        correctAnswer: correctAnswer || undefined,
        explanation: explanation || undefined,
        difficulty,
        points: Number(points) || 1,
        skillId: skillId || undefined,
        categoryId: categoryId || undefined,
        source: "HUMAN" as QuestionSource,
        status: "APPROVED" as QuestionStatus,
        createdById: (session.user as any)?.id || undefined,
      },
    });

    // If companyId is supplied, find or create the company's assessment and link it
    let targetAssessmentId = assessmentId;
    if (!targetAssessmentId && companyId) {
      let assessment = await db.assessment.findFirst({
        where: { companyId },
        orderBy: { createdAt: "desc" },
      });
      if (!assessment) {
        const company = await db.company.findUnique({ where: { id: companyId } });
        assessment = await db.assessment.create({
          data: {
            name: `${company?.name || 'Corporate'} Assessment`,
            companyId,
            durationMinutes: 45,
            isPublished: true,
          },
        });
      }
      targetAssessmentId = assessment.id;
    }

    if (targetAssessmentId) {
      const highestOrder = await db.assessmentQuestion.findFirst({
        where: { assessmentId: targetAssessmentId },
        orderBy: { order: "desc" },
      });
      const nextOrder = (highestOrder?.order ?? -1) + 1;

      await db.assessmentQuestion.upsert({
        where: {
          assessmentId_questionId: {
            assessmentId: targetAssessmentId,
            questionId: question.id,
          },
        },
        update: {},
        create: {
          assessmentId: targetAssessmentId,
          questionId: question.id,
          order: nextOrder,
        },
      });

      // Update assessment numQuestions count
      const totalCount = await db.assessmentQuestion.count({
        where: { assessmentId: targetAssessmentId },
      });
      await db.assessment.update({
        where: { id: targetAssessmentId },
        data: { numQuestions: totalCount },
      });
    }

    return NextResponse.json(question, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create question" }, { status: 500 });
  }
}
