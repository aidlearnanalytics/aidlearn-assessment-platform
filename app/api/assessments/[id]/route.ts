import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assessment = await db.assessment.findUnique({
      where: { id: params.id },
      include: {
        company: true,
        questions: { include: { question: true }, orderBy: { order: "asc" } },
        _count: { select: { attempts: true } },
      },
    });

    if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ assessment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await db.assessment.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Assessment not found" }, { status: 404 });

    const body = await req.json();
    const {
      name,
      durationMinutes,
      passingScorePct,
      description,
      isPublished,
      numQuestions,
      requireFullscreen,
      monitorTabSwitch,
    } = body;

    const updated = await db.assessment.update({
      where: { id: params.id },
      data: {
        name: name !== undefined ? name : undefined,
        durationMinutes: durationMinutes !== undefined ? Math.max(Number(durationMinutes) || 10, 1) : undefined,
        passingScorePct: passingScorePct !== undefined ? Number(passingScorePct) : undefined,
        description: description !== undefined ? description : undefined,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : undefined,
        numQuestions: numQuestions !== undefined ? Number(numQuestions) : undefined,
        requireFullscreen: requireFullscreen !== undefined ? Boolean(requireFullscreen) : undefined,
        monitorTabSwitch: monitorTabSwitch !== undefined ? Boolean(monitorTabSwitch) : undefined,
      },
    });

    return NextResponse.json({ success: true, assessment: updated });
  } catch (err: any) {
    console.error("Assessment Update Error:", err);
    return NextResponse.json({ error: err.message || "Failed to update assessment" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assessmentId = params.id;

    // Cascade delete attempts and assessment questions
    await db.assessmentQuestion.deleteMany({ where: { assessmentId } }).catch(() => {});
    await db.assessmentAttempt.deleteMany({ where: { assessmentId } }).catch(() => {});
    await db.assessment.delete({ where: { id: assessmentId } });

    return NextResponse.json({ success: true, deletedId: assessmentId });
  } catch (err: any) {
    console.error("Assessment Delete Error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete assessment" }, { status: 500 });
  }
}
