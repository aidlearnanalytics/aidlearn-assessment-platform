import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let session;
  try {
    session = await requireRole(["SUPER_ADMIN", "COMPANY_ADMIN", "REVIEWER"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.question.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "PENDING_APPROVAL" && existing.status !== "APPROVED") {
    return NextResponse.json({ error: "Only pending or approved questions can be rejected" }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const reason: string | undefined = body?.reason;

  const question = await db.question.update({
    where: { id: params.id },
    data: {
      status: "REJECTED",
      approvedById: (session.user as any).id,
      approvedAt: new Date(),
      explanation: reason ? `${existing.explanation ?? ""}\n\n[Rejection note] ${reason}`.trim() : existing.explanation,
    },
  });

  return NextResponse.json({ question });
}
