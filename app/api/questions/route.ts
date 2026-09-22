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
    const { prompt, type = "MULTIPLE_CHOICE", options, correctAnswer, explanation, difficulty = "intermediate", points = 1, skillId, categoryId, assessmentId } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const question = await db.question.create({
      data: {
        prompt,
        type: type as QuestionType,
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

    if (assessmentId) {
      await db.assessmentQuestion.create({
        data: {
          assessmentId,
          questionId: question.id,
        },
      });
    }

    return NextResponse.json(question, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create question" }, { status: 500 });
  }
}
