export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; linkId: string } }
) {
  try {
    await requireRole(["SUPER_ADMIN", "COMPANY_ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.assessmentQuestion.delete({ where: { id: params.linkId } });
  return NextResponse.json({ ok: true });
}
