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
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.status === "SUBMITTED" || attempt.status === "TERMINATED") {
      return NextResponse.json({
        success: true,
        alreadySubmitted: true,
        attemptId: attempt.id,
        overallPct: attempt.overallPct,
      });
    }

    const body = await req.json();
    const { answers, fullscreenExits = 0, tabSwitches = 0, mouseExits = 0 } = body;

    // Record violations if any
    const violationData: Array<{ attemptId: string; type: string; detail: string }> = [];
    if (fullscreenExits > 0) {
      violationData.push({
        attemptId: attempt.id,
        type: "FULLSCREEN_EXIT",
        detail: `Candidate exited fullscreen mode ${fullscreenExits} time(s).`,
      });
    }
    if (tabSwitches > 0) {
      violationData.push({
        attemptId: attempt.id,
        type: "TAB_SWITCH",
        detail: `Candidate switched browser tabs ${tabSwitches} time(s).`,
      });
    }
    if (mouseExits > 0) {
      violationData.push({
        attemptId: attempt.id,
        type: "VISIBILITY_HIDDEN",
        detail: `Cursor departed examination viewport ${mouseExits} time(s).`,
      });
    }

    if (violationData.length > 0) {
      await db.violationLog.createMany({ data: violationData });
    }

    // Process & Grade Each Question
    let totalPointsAwarded = 0;
    let totalPossiblePoints = 0;
    let correctCount = 0;

    const categoryScores: Record<string, { earned: number; possible: number }> = {};
    const difficultyScores: Record<string, { earned: number; possible: number }> = {};
    const questionsSummaryForAI: Array<{
      prompt: string;
      skill: string;
      category?: string;
      isCorrect: boolean;
      candidateAnswer: any;
      explanation?: string;
    }> = [];

    for (const aq of attempt.assessment.questions) {
      const q = aq.question;
      const qPoints = aq.pointsOverride || q.points || 1;
      totalPossiblePoints += qPoints;

      const catName = q.category?.name || q.skill?.name || "General Analytics";
      const diff = q.difficulty || "INTERMEDIATE";

      if (!categoryScores[catName]) categoryScores[catName] = { earned: 0, possible: 0 };
      categoryScores[catName].possible += qPoints;

      if (!difficultyScores[diff]) difficultyScores[diff] = { earned: 0, possible: 0 };
      difficultyScores[diff].possible += qPoints;

      const candidateResponse = answers ? answers[q.id] : undefined;
      let isCorrect = false;

      // Evaluation Logic
      if (q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") {
        let correctOptText = q.correctAnswer;
        if (!correctOptText && q.options) {
          try {
            const parsed = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
            const correctOpt = parsed.find((o: any) => o.isCorrect);
            if (correctOpt) correctOptText = correctOpt.text || correctOpt.id;
          } catch {}
        }
        if (candidateResponse && correctOptText) {
          isCorrect = String(candidateResponse).trim().toLowerCase() === String(correctOptText).trim().toLowerCase();
        }
      } else if (q.type === "MULTIPLE_SELECT") {
        let correctIds: string[] = [];
        if (q.options) {
          try {
            const parsed = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
            correctIds = parsed.filter((o: any) => o.isCorrect).map((o: any) => String(o.text || o.id).toLowerCase());
          } catch {}
        }
        if (Array.isArray(candidateResponse) && correctIds.length > 0) {
          const userSelected = candidateResponse.map((v: any) => String(v).trim().toLowerCase());
          const match =
            userSelected.length === correctIds.length &&
            userSelected.every((u: string) => correctIds.includes(u));
          isCorrect = match;
        }
      } else if (q.type === "FORMULA_ENTRY" || q.type === "SHORT_ANSWER") {
        if (candidateResponse && q.correctAnswer) {
          const cleanUser = String(candidateResponse).replace(/\s+/g, "").toLowerCase();
          const cleanTarget = String(q.correctAnswer).replace(/\s+/g, "").toLowerCase();
          isCorrect = cleanUser === cleanTarget;
        }
      }

      const pointsAwarded = isCorrect ? qPoints : 0;
      if (isCorrect) {
        totalPointsAwarded += qPoints;
        correctCount++;
        categoryScores[catName].earned += qPoints;
        difficultyScores[diff].earned += qPoints;
      }

      questionsSummaryForAI.push({
        prompt: q.prompt,
        skill: q.skill?.name || "Analytics",
        category: q.category?.name,
        isCorrect,
        candidateAnswer: candidateResponse,
        explanation: q.explanation || undefined,
      });

      // Upsert candidate answer record
      await db.answer.upsert({
        where: {
          attemptId_questionId: {
            attemptId: attempt.id,
            questionId: q.id,
          },
        },
        create: {
          attemptId: attempt.id,
          questionId: q.id,
          response: typeof candidateResponse === "object" ? candidateResponse : { value: candidateResponse },
          isCorrect,
          pointsAwarded,
        },
        update: {
          response: typeof candidateResponse === "object" ? candidateResponse : { value: candidateResponse },
          isCorrect,
          pointsAwarded,
        },
      });
    }

    const overallPct =
      totalPossiblePoints > 0
        ? Math.round((totalPointsAwarded / totalPossiblePoints) * 100)
        : 0;

    const categoryScoresPct: Record<string, number> = {};
    for (const [k, v] of Object.entries(categoryScores)) {
      categoryScoresPct[k] = v.possible > 0 ? Math.round((v.earned / v.possible) * 100) : 0;
    }

    const difficultyScoresPct: Record<string, number> = {};
    for (const [k, v] of Object.entries(difficultyScores)) {
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
        categoryScores: categoryScoresPct as any,
        difficultyScores: difficultyScoresPct as any,
        aiDiagnostic: aiDiagnostic as any,
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
