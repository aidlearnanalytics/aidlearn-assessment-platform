export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { assessmentInputSchema } from "@/lib/validations/assessment";

const ADMIN_ROLES = ["SUPER_ADMIN", "COMPANY_ADMIN"];

export async function GET() {
  try {
    await requireRole(ADMIN_ROLES);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const assessments = await db.assessment.findMany({
    orderBy: { createdAt: "desc" },
    include: { company: true, _count: { select: { questions: true, attempts: true } } },
  });

  return NextResponse.json({ assessments });
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(ADMIN_ROLES);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = assessmentInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const assessment = await db.assessment.create({
    data: {
      name: data.name,
      companyId: data.companyId,
      description: data.description,
      durationMinutes: data.durationMinutes,
      numQuestions: data.numQuestions,
      categories: data.categories ? JSON.stringify(data.categories) : undefined,
      randomizeQuestions: data.randomizeQuestions,
      randomizeOptions: data.randomizeOptions,
      requireScreenShare: data.requireScreenShare,
      requireFullscreen: data.requireFullscreen,
      monitorTabSwitch: data.monitorTabSwitch,
      monitorVisibility: data.monitorVisibility,
      maxViolations: data.maxViolations,
      passingScorePct: data.passingScorePct,
    },
  });

  return NextResponse.json({ assessment }, { status: 201 });
}
