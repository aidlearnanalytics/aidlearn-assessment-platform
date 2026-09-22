export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const body = await req.json();
    const { type, detail } = body;

    const log = await db.violationLog.create({
      data: {
        attemptId: params.attemptId,
        type: type || "TAB_SWITCH",
        detail: detail || undefined,
        occurredAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, logId: log.id });
  } catch (err: any) {
    console.error("Violation logging error:", err);
    return NextResponse.json({ error: "Failed to record violation" }, { status: 500 });
  }
}
