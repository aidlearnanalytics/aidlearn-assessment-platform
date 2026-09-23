import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No question IDs provided for deletion." },
        { status: 400 }
      );
    }

    // 1. Find all linked assessment IDs
    const links = await db.assessmentQuestion.findMany({
      where: { questionId: { in: ids } },
      select: { assessmentId: true },
    }).catch(() => []);
    const assessmentIds = Array.from(new Set(links.map((l) => l.assessmentId)));

    // 2. Cascade delete dependent Answers to prevent Postgres foreign key violations
    await db.answer.deleteMany({
      where: { questionId: { in: ids } },
    }).catch((err) => {
      console.warn("Bulk answer delete warning:", err.message);
    });

    // 3. Delete junction AssessmentQuestion records
    await db.assessmentQuestion.deleteMany({
      where: { questionId: { in: ids } },
    }).catch((err) => {
      console.warn("Bulk assessmentQuestion delete warning:", err.message);
    });

    // 4. Delete the Questions
    const deleteResult = await db.question.deleteMany({
      where: { id: { in: ids } },
    });

    // 5. Recount and update affected assessments
    for (const aId of assessmentIds) {
      try {
        const count = await db.assessmentQuestion.count({
          where: { assessmentId: aId },
        });
        await db.assessment.update({
          where: { id: aId },
          data: { numQuestions: count },
        });
      } catch (countErr) {
        console.warn("Assessment recount warning:", countErr);
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
      ids,
    });
  } catch (err: any) {
    console.error("Bulk Delete Questions Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to bulk delete questions." },
      { status: 500 }
    );
  }
}
