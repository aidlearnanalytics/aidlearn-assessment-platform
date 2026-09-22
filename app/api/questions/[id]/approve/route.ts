import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  let session;
  try {
    session = await requireRole(["SUPER_ADMIN", "COMPANY_ADMIN", "REVIEWER"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.question.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "PENDING_APPROVAL") {
    return NextResponse.json({ error: "Only pending questions can be approved" }, { status: 409 });
  }

  const question = await db.question.update({
    where: { id: params.id },
    data: {
      status: "APPROVED",
      approvedById: (session.user as any).id,
      approvedAt: new Date(),
    },
  });

  return NextResponse.json({ question });
}
