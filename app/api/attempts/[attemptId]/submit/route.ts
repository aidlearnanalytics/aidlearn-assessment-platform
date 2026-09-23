import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateAIDiagnostic } from "@/lib/gemini";
import { ViolationType } from "@prisma/client";

export const dynamic = "force-dynamic";

// Helper function to evaluate correctness across all question types and option ID/text/letter variations
function evaluateQuestionCorrectness(q: any, candidateResponse: any): boolean {
  if (candidateResponse === undefined || candidateResponse === null || candidateResponse === "") {
    return false;
  }

  // Parse options safely
  let optionsArray: any[] = [];
  if (q.options) {
    try {
      optionsArray = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
      if (!Array.isArray(optionsArray)) optionsArray = [];
    } catch {
      optionsArray = [];
    }
  }

  const cleanCandidate = String(candidateResponse).trim().toLowerCase();

  if (q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") {
    // 1. Check if candidate response matches the option marked isCorrect: true
    const correctOption = optionsArray.find((o) => o.isCorrect === true);
    if (correctOption) {
      const optId = String(correctOption.id || "").trim().toLowerCase();
      const optKey = String(correctOption.key || "").trim().toLowerCase();
      const optText = String(correctOption.text || "").trim().toLowerCase();
      const optIndex = optionsArray.indexOf(correctOption);
      const letter = String.fromCharCode(65 + optIndex).toLowerCase(); // 'a', 'b', 'c', 'd'

      if (
        cleanCandidate === optId ||
        cleanCandidate === optKey ||
        cleanCandidate === optText ||
        cleanCandidate === letter ||
        cleanCandidate === String(optIndex + 1) ||
        cleanCandidate === String(optIndex)
      ) {
        return true;
      }
    }

    // 2. Fallback check against q.correctAnswer if specified
    if (q.correctAnswer) {
      const cleanCorrect = String(q.correctAnswer).trim().toLowerCase();
      if (cleanCandidate === cleanCorrect) return true;

      // Check if q.correctAnswer was an option ID or option text
      const matchedOpt = optionsArray.find(
        (o) =>
          String(o.id).toLowerCase() === cleanCorrect ||
          String(o.text).toLowerCase() === cleanCorrect
      );
      if (matchedOpt) {
        const optId = String(matchedOpt.id || "").trim().toLowerCase();
        const optText = String(matchedOpt.text || "").trim().toLowerCase();
        if (cleanCandidate === optId || cleanCandidate === optText) {
          return true;
        }
      }
    }

    return false;
  }

  if (q.type === "MULTIPLE_SELECT") {
    const correctIds = optionsArray
      .filter((o) => o.isCorrect === true)
      .map((o) => String(o.id || o.key || o.text).toLowerCase());

    const candArr = Array.isArray(candidateResponse)
      ? candidateResponse.map((c) => String(c).toLowerCase())
      : [String(candidateResponse).toLowerCase()];

    if (correctIds.length > 0) {
      return (
        correctIds.length === candArr.length &&
        correctIds.every((id) => candArr.includes(id))
      );
    }

    if (Array.isArray(q.correctAnswer)) {
      const sortedA = [...candArr].sort();
      const sortedB = q.correctAnswer.map((c: any) => String(c).toLowerCase()).sort();
      return JSON.stringify(sortedA) === JSON.stringify(sortedB);
    }
    return false;
  }

  if (q.type === "FORMULA_ENTRY" || q.type === "SHORT_ANSWER") {
    if (!q.correctAnswer) return false;
    const stripFormula = (str: string) =>
      str.replace(/\s+/g, "").replace(/^=/, "").toLowerCase();
    return stripFormula(String(candidateResponse)) === stripFormula(String(q.correctAnswer));
  }

  return false;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const { attemptId } = params;
    const body = await req.json();
    const { answers = {}, violations = [], timeTakenSecs = 0 } = body;

    const attempt = await db.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          include: {
            questions: {
              include: { question: { include: { category: true, skill: true } } },
              orderBy: { order: "asc" },
            },
          },
        },
        participant: { include: { company: true } },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    // Save Violations
    const violationData = (violations || []).map((v: any) => ({
      attemptId,
      type: v.type as ViolationType,
      detail: v.detail || "",
    }));

    if (violationData.length > 0) {
      await db.violationLog.createMany({ data: violationData }).catch(() => {});
    }

    // Process & Grade Each Question Accurately
    let totalScore = 0;
    let correctCount = 0;
    let maxPossibleScore = 0;

    const categoryScores: Record<string, { earned: number; possible: number }> = {};
    const detailedResponses: any[] = [];

    for (const aq of attempt.assessment.questions) {
      const q = aq.question;
      const points = aq.pointsOverride || q.points || 1;
      maxPossibleScore += points;

      const catName = q.category?.name || q.skill?.name || "Analytical Modeling";
      if (!categoryScores[catName]) {
        categoryScores[catName] = { earned: 0, possible: 0 };
      }
      categoryScores[catName].possible += points;

      const candidateResponse = answers[q.id];
      const isCorrect = evaluateQuestionCorrectness(q, candidateResponse);

      if (isCorrect) {
        correctCount += 1;
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
      }).catch((err) => {
        console.warn("Answer upsert error:", err.message);
      });
    }

    const overallPct =
      maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    // Convert category scores to percentages
    const finalCategoryScores: Record<string, { earned: number; possible: number; pct: number }> = {};
    for (const [cat, val] of Object.entries(categoryScores)) {
      finalCategoryScores[cat] = {
        ...val,
        pct: val.possible > 0 ? Math.round((val.earned / val.possible) * 100) : 0,
      };
    }

    // Call Gemini AI Diagnostic
    let aiDiagnostic = null;
    try {
      aiDiagnostic = await generateAIDiagnostic({
        candidateName: attempt.participant.fullName,
        assessmentTitle: attempt.assessment.name,
        overallScore: totalScore,
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
      correctCount,
      totalQuestions: attempt.assessment.questions.length,
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
