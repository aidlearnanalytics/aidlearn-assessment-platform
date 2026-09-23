import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Reset or delete a candidate's attempt so they can retake the assessment
export async function POST(
  req: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const { attemptId } = params;

    const attempt = await db.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: { participant: true },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    // Delete associated answers and violations first (or cascade)
    await db.answer.deleteMany({ where: { attemptId } }).catch(() => {});
    await db.violationLog.deleteMany({ where: { attemptId } }).catch(() => {});
    
    // Delete the attempt record to allow clean retake
    await db.assessmentAttempt.delete({
      where: { id: attemptId },
    });

    return NextResponse.json({
      success: true,
      message: `Attempt reset successfully for ${attempt.participant.fullName}. The candidate can now register and retake the assessment.`,
      participantId: attempt.participantId,
    });
  } catch (error: any) {
    console.error("Reset Attempt Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset attempt" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  return POST(req, { params });
}
