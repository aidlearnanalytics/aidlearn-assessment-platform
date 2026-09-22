import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateCandidateDiagnostic } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const attempt = await db.assessmentAttempt.findUnique({
      where: { id: params.attemptId },
      include: {
        participant: { include: { company: true } },
        assessment: {
          include: {
            questions: {
              include: {
                question: {
                  include: { skill: true, category: true },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Assessment attempt not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const answersMap: Record<string, any> = body.answers || {};

    let totalPointsAwarded = 0;
    let maxPointsPossible = 0;
    let correctCount = 0;

    const categoryStats: Record<string, { earned: number; possible: number }> = {};
    const difficultyStats: Record<string, { earned: number; possible: number }> = {};
    const questionsSummaryForAI: any[] = [];

    // Grade each question
    for (const aq of attempt.assessment.questions) {
      const q = aq.question;
      const points = aq.pointsOverride ?? q.points ?? 1;
      maxPointsPossible += points;

      const candidateResponse = answersMap[q.id];
      let isCorrect = false;

      // Evaluate Correctness
      if (q.type === "MULTIPLE_CHOICE") {
        if (q.correctAnswer && String(candidateResponse).trim().toUpperCase() === String(q.correctAnswer).trim().toUpperCase()) {
          isCorrect = true;
        } else if (q.options) {
          const opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
          const correctOpt = opts.find((o: any) => o.isCorrect);
          if (correctOpt && (candidateResponse === correctOpt.id || candidateResponse === correctOpt.key)) {
            isCorrect = true;
          }
        }
      } else if (q.type === "MULTIPLE_SELECT") {
        if (q.options && Array.isArray(candidateResponse)) {
          const opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
          const correctIds = opts.filter((o: any) => o.isCorrect).map((o: any) => o.id || o.key).sort();
          const selectedIds = [...candidateResponse].sort();
          if (correctIds.length > 0 && JSON.stringify(correctIds) === JSON.stringify(selectedIds)) {
            isCorrect = true;
          }
        }
      } else if (q.type === "TRUE_FALSE") {
        if (
          candidateResponse &&
          q.correctAnswer &&
          String(candidateResponse).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()
        ) {
          isCorrect = true;
        }
      } else if (q.type === "SHORT_ANSWER" || q.type === "FORMULA_ENTRY") {
        if (candidateResponse && q.correctAnswer) {
          const cleanCandidate = String(candidateResponse).replace(/\s+/g, "").toLowerCase();
          const cleanExpected = String(q.correctAnswer).replace(/\s+/g, "").toLowerCase();
          if (cleanCandidate === cleanExpected) {
            isCorrect = true;
          }
        }
      }

      const pointsAwarded = isCorrect ? points : 0;
      totalPointsAwarded += pointsAwarded;
      if (isCorrect) correctCount++;

      // Track Category & Difficulty Stats
      const catName = q.category?.name || "General Practical";
      if (!categoryStats[catName]) categoryStats[catName] = { earned: 0, possible: 0 };
      categoryStats[catName].earned += pointsAwarded;
      categoryStats[catName].possible += points;

      const diff = q.difficulty || "intermediate";
      if (!difficultyStats[diff]) difficultyStats[diff] = { earned: 0, possible: 0 };
      difficultyStats[diff].earned += pointsAwarded;
      difficultyStats[diff].possible += points;

      // Save Answer record
      await db.answer.upsert({
        where: {
          attemptId_questionId: {
            attemptId: attempt.id,
            questionId: q.id,
          },
        },
        update: {
          response: typeof candidateResponse === "object" ? JSON.stringify(candidateResponse) : String(candidateResponse ?? ""),
          isCorrect,
          pointsAwarded,
          answeredAt: new Date(),
        },
        create: {
          attemptId: attempt.id,
          questionId: q.id,
          response: typeof candidateResponse === "object" ? JSON.stringify(candidateResponse) : String(candidateResponse ?? ""),
          isCorrect,
          pointsAwarded,
          answeredAt: new Date(),
        },
      });

      questionsSummaryForAI.push({
        prompt: q.prompt,
        skill: q.skill?.name || "Excel",
        category: catName,
        isCorrect,
        candidateAnswer: candidateResponse,
        explanation: q.explanation || undefined,
      });
    }

    const overallPct = maxPointsPossible > 0 ? (totalPointsAwarded / maxPointsPossible) * 100 : 0;

    const categoryScoresPct: Record<string, number> = {};
    for (const [k, v] of Object.entries(categoryStats)) {
      categoryScoresPct[k] = v.possible > 0 ? Math.round((v.earned / v.possible) * 100) : 0;
    }

    const difficultyScoresPct: Record<string, number> = {};
    for (const [k, v] of Object.entries(difficultyStats)) {
      difficultyScoresPct[k] = v.possible > 0 ? Math.round((v.earned / v.possible) * 100) : 0;
    }

    // Compute duration taken
    const now = new Date();
    const started = attempt.startedAt ? new Date(attempt.startedAt) : now;
    const timeTakenSecs = Math.max(0, Math.round((now.getTime() - started.getTime()) / 1000));

    // Call Gemini AI for Comprehensive Candidate Diagnostic
    let aiDiagnostic = null;
    try {
      aiDiagnostic = await generateCandidateDiagnostic({
        candidateName: attempt.participant.fullName,
        companyName: attempt.participant.company.name,
        overallScore: totalPointsAwarded,
        overallPct,
        totalQuestions: attempt.assessment.questions.length,
        correctCount,
        categoryScores: categoryScoresPct,
        questionsSummary: questionsSummaryForAI,
      });
    } catch (aiErr) {
      console.error("AI Diagnostic Error during submit:", aiErr);
    }

    // Update Assessment Attempt
    await db.assessmentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "SUBMITTED",
        submittedAt: now,
        timeTakenSecs,
        overallScore: totalPointsAwarded,
        overallPct,
        categoryScores: JSON.stringify(categoryScoresPct),
        difficultyScores: JSON.stringify(difficultyScoresPct),
        aiDiagnostic: aiDiagnostic ? JSON.stringify(aiDiagnostic) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      overallPct,
      totalScore: totalPointsAwarded,
    });
  } catch (err: any) {
    console.error("Assessment Submit Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to finalize assessment submission" },
      { status: 500 }
    );
  }
}
