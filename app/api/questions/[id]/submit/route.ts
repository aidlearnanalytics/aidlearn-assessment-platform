import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(["SUPER_ADMIN", "COMPANY_ADMIN", "REVIEWER"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.question.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "DRAFT") {
    return NextResponse.json({ error: "Only draft questions can be submitted for approval" }, { status: 409 });
  }

  const question = await db.question.update({
    where: { id: params.id },
    data: { status: "PENDING_APPROVAL" },
  });

  return NextResponse.json({ question });
}
