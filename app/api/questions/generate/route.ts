import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { generateQuestionsWithGemini } from "@/lib/gemini";
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
    const { companyId, topic, industry, difficulty, numQuestions, notes, autoApprove } = body;

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const count = Math.min(Math.max(Number(numQuestions) || 5, 1), 20);
    const diff = difficulty || "intermediate";

    const generated = await generateQuestionsWithGemini({
      topic,
      industry,
      difficulty: diff,
      numQuestions: count,
      notes,
    });

    // If autoApprove is requested or companyId provided, save directly to database
    if (autoApprove || companyId) {
      const savedQuestions = [];

      // Find company assessment if companyId exists
      let assessment = null;
      if (companyId) {
        assessment = await db.assessment.findFirst({
          where: { companyId },
          orderBy: { createdAt: "desc" },
        });
      }

      for (const q of generated) {
        const skill = await findOrCreateSkill(q.skillName || "General");
        const category = await findOrCreateCategory(q.categoryName || topic);

        // Format options
        let formattedOptions = undefined;
        let correctAnswer = q.correctAnswer;
        if (q.options && Array.isArray(q.options)) {
          formattedOptions = JSON.stringify(q.options);
          const correct = q.options.find((o: any) => o.isCorrect);
          if (correct) {
            correctAnswer = (correct as any).id || (correct as any).key || correctAnswer;
          }
        }

        const saved = await db.question.create({
          data: {
            companyId: companyId || undefined,
            prompt: q.prompt,
            type: q.type,
            options: formattedOptions,
            correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty || diff,
            industry: industry || undefined,
            points: q.points || 1,
            skillId: skill.id,
            categoryId: category?.id,
            source: "AI_GENERATED",
            status: "APPROVED",
            createdById: (session.user as any).id,
            approvedById: (session.user as any).id,
            approvedAt: new Date(),
          },
        });

        // Link to assessment
        if (assessment) {
          const highestOrder = await db.assessmentQuestion.aggregate({
            where: { assessmentId: assessment.id },
            _max: { order: true },
          });
          const nextOrder = (highestOrder._max.order ?? 0) + 1;

          await db.assessmentQuestion.create({
            data: {
              assessmentId: assessment.id,
              questionId: saved.id,
              order: nextOrder,
            },
          });
        }

        savedQuestions.push(saved);
      }
      return NextResponse.json({ questions: savedQuestions, count: savedQuestions.length, saved: true });
    }

    return NextResponse.json({ questions: generated, count: generated.length, saved: false });
  } catch (err: any) {
    console.error("Generate API Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate questions with AI" },
      { status: 500 }
    );
  }
}
