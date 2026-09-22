import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "COMPANY_ADMIN"];

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(ADMIN_ROLES);
    await db.assessmentQuestion.deleteMany({
      where: { questionId: params.id },
    });
    await db.question.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete question" }, { status: 500 });
  }
}
