import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateQuestionsWithGemini } from "@/lib/gemini";
import { db } from "@/lib/db";
import { QuestionType, QuestionStatus, QuestionSource } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      topic,
      industry,
      difficulty = "INTERMEDIATE",
      numQuestions,
      count,
      notes,
      autoApprove = true,
      assessmentId,
      companyId,
    } = body;

    if (!topic) {
      return NextResponse.json(
        { error: "Topic / Skill area is required." },
        { status: 400 }
      );
    }

    // Allow unlimited number of questions requested by admin (minimum 1)
    const targetCount = Math.max(Number(numQuestions || count) || 5, 1);

    // Call Gemini to generate questions with parallel batching
    const generated = await generateQuestionsWithGemini({
      topic,
      industry: industry || "Financial Services & Analytics",
      difficulty,
      numQuestions: targetCount,
      notes,
    });

    // If companyId is supplied, find or create the company's assessment
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

    const savedQuestions = [];

    // Find starting order for assessment linking
    let currentOrder = 0;
    if (targetAssessmentId) {
      const highestOrder = await db.assessmentQuestion.findFirst({
        where: { assessmentId: targetAssessmentId },
        orderBy: { order: "desc" },
      });
      currentOrder = (highestOrder?.order ?? -1) + 1;
    }

    for (let i = 0; i < generated.length; i++) {
      const q = generated[i];

      // Format options safely
      const formattedOptions = (q.options || []).map((opt, idx) => ({
        id: String(opt.id || String.fromCharCode(65 + idx)),
        key: String(opt.id || String.fromCharCode(65 + idx)),
        text: opt.text,
        isCorrect: !!opt.isCorrect,
      }));

      const saved = await db.question.create({
        data: {
          prompt: q.prompt,
          type: (q.type as QuestionType) || "MULTIPLE_CHOICE",
          options: formattedOptions,
          correctAnswer: q.correctAnswer || undefined,
          explanation: q.explanation || undefined,
          difficulty: q.difficulty || difficulty,
          points: q.points || 1,
          status: "APPROVED" as QuestionStatus,
          source: "AI_GENERATED" as QuestionSource,
          createdById: (session.user as any)?.id || undefined,
        },
      });

      savedQuestions.push(saved);

      if (targetAssessmentId) {
        await db.assessmentQuestion.upsert({
          where: {
            assessmentId_questionId: {
              assessmentId: targetAssessmentId,
              questionId: saved.id,
            },
          },
          update: {},
          create: {
            assessmentId: targetAssessmentId,
            questionId: saved.id,
            order: currentOrder + i,
          },
        });
      }
    }

    // Update assessment numQuestions total count
    if (targetAssessmentId) {
      const totalCountInDb = await db.assessmentQuestion.count({
        where: { assessmentId: targetAssessmentId },
      });
      await db.assessment.update({
        where: { id: targetAssessmentId },
        data: { numQuestions: totalCountInDb },
      });
    }

    return NextResponse.json({
      success: true,
      questions: savedQuestions,
      count: savedQuestions.length,
      generatedCount: savedQuestions.length,
    });
  } catch (err: any) {
    console.error("Generate Questions Route Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate assessment questions." },
      { status: 500 }
    );
  }
}
