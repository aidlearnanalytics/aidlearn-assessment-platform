import { NextRequest, NextResponse } from "next/server";
import { generateQuestionsWithGemini } from "@/lib/gemini";
import { db } from "@/lib/db";
import { QuestionType, QuestionStatus, QuestionSource } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      topic,
      industry,
      difficulty = "intermediate",
      numQuestions = 5,
      notes,
      autoApprove = false,
      assessmentId,
    } = body;

    if (!topic) {
      return NextResponse.json(
        { error: "Topic / Skill area is required." },
        { status: 400 }
      );
    }

    // Call Gemini to generate questions
    const generated = await generateQuestionsWithGemini({
      topic,
      industry,
      difficulty,
      numQuestions: Math.min(Math.max(Number(numQuestions) || 5, 1), 20),
      notes,
    });

    if (autoApprove) {
      const savedQuestions = [];

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
            type: q.type as QuestionType,
            options: formattedOptions,
            correctAnswer: q.correctAnswer || undefined,
            explanation: q.explanation || undefined,
            difficulty: q.difficulty || difficulty,
            points: q.points || 1,
            status: "APPROVED" as QuestionStatus,
            source: "AI_GENERATED" as QuestionSource,
          },
        });

        savedQuestions.push(saved);

        if (assessmentId) {
          await db.assessmentQuestion.upsert({
            where: {
              assessmentId_questionId: {
                assessmentId,
                questionId: saved.id,
              },
            },
            update: {},
            create: {
              assessmentId,
              questionId: saved.id,
              order: i,
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        questions: savedQuestions,
        count: savedQuestions.length,
      });
    }

    return NextResponse.json({
      success: true,
      questions: generated,
      count: generated.length,
    });
  } catch (err: any) {
    console.error("Generate Questions Route Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate assessment questions." },
      { status: 500 }
    );
  }
}
