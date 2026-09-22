import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateAIDiagnostic } from "@/lib/gemini";
import { ViolationType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const { attemptId } = params;
    const body = await req.json();
    const { answers, violations, timeTakenSecs } = body;

    // Fetch Attempt & Questions
    const attempt = await db.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          include: {
            questions: {
              include: { question: { include: { category: true } } },
            },
          },
        },
        participant: true,
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.status === "SUBMITTED") {
      return NextResponse.json(
        { error: "Assessment already submitted" },
        { status: 400 }
      );
    }

    // Save Violations
    const violationData = (violations || []).map((v: any) => ({
      attemptId,
      type: v.type as ViolationType,
      detail: v.detail || "",
    }));

    if (violationData.length > 0) {
      await db.violationLog.createMany({ data: violationData });
    }

    // Process & Grade Each Question
    let totalScore = 0;
    let maxPossibleScore = 0;

    const categoryScores: Record<string, { earned: number; possible: number }> = {};
    const detailedResponses: any[] = [];

    for (const aq of attempt.assessment.questions) {
      const q = aq.question;
      const points = aq.pointsOverride || q.points || 1;
      maxPossibleScore += points;

      const catName = q.category?.name || "General";
      if (!categoryScores[catName]) {
        categoryScores[catName] = { earned: 0, possible: 0 };
      }
      categoryScores[catName].possible += points;

      const candidateResponse = answers[q.id];
      let isCorrect = false;

      if (q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") {
        isCorrect =
          candidateResponse !== undefined &&
          String(candidateResponse).trim().toLowerCase() ===
            String(q.correctAnswer).trim().toLowerCase();
      } else if (q.type === "MULTIPLE_SELECT") {
        // Compare sorted arrays
        if (Array.isArray(candidateResponse) && Array.isArray(q.correctAnswer)) {
          const sortedA = [...candidateResponse].sort();
          const sortedB = [...q.correctAnswer].sort();
          isCorrect = JSON.stringify(sortedA) === JSON.stringify(sortedB);
        }
      } else if (q.type === "FORMULA_ENTRY" || q.type === "SHORT_ANSWER") {
        isCorrect =
          candidateResponse !== undefined &&
          String(candidateResponse)
            .replace(/\s+/g, "")
            .toLowerCase() ===
            String(q.correctAnswer)
              .replace(/\s+/g, "")
              .toLowerCase();
      }

      const pointsAwarded = isCorrect ? points : 0;
      totalScore += pointsAwarded;
      categoryScores[catName].earned += pointsAwarded;

      detailedResponses.push({
        prompt: q.prompt,
        type: q.type,
        candidateAnswer: candidateResponse,
        correctAnswer: q.correctAnswer,
        isCorrect,
        pointsAwarded,
        pointsPossible: points,
        category: catName,
      });

      // Save Answer Record
      await db.answer.upsert({
        where: {
          attemptId_questionId: {
            attemptId,
            questionId: q.id,
          },
        },
        create: {
          attemptId,
          questionId: q.id,
          response: candidateResponse ?? null,
          isCorrect,
          pointsAwarded,
        },
        update: {
          response: candidateResponse ?? null,
          isCorrect,
          pointsAwarded,
        },
      });
    }

    const overallPct =
      maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    // Convert category scores to percentages
    const finalCategoryScores: Record<string, { earned: number; possible: number; pct: number }> = {};
    for (const [cat, val] of Object.entries(categoryScores)) {
      finalCategoryScores[cat] = {
        ...val,
        pct: val.possible > 0 ? (val.earned / val.possible) * 100 : 0,
      };
    }

    // Call Gemini AI Diagnostic
    let aiDiagnostic = null;
    try {
      aiDiagnostic = await generateAIDiagnostic({
        candidateName: attempt.participant.fullName,
        assessmentTitle: attempt.assessment.name,
        overallPct,
        categoryScores: finalCategoryScores,
        detailedResponses,
      });
    } catch (aiErr) {
      console.error("AI Diagnostic Error:", aiErr);
    }

    // Update Attempt Record
    const updatedAttempt = await db.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        timeTakenSecs: timeTakenSecs || 0,
        overallScore: totalScore,
        overallPct,
        categoryScores: finalCategoryScores,
        aiDiagnostic: aiDiagnostic ? (aiDiagnostic as any) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      attemptId: updatedAttempt.id,
      overallPct,
      overallScore: totalScore,
      maxPossibleScore,
      categoryScores: finalCategoryScores,
      aiDiagnostic,
    });
  } catch (error: any) {
    console.error("Submit error:", error);
    return NextResponse.json(
      { error: "Submission failed", detail: error.message },
      { status: 500 }
    );
  }
}
