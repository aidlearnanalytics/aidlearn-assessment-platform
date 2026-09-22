import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await requireRole(["SUPER_ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const name: string = body?.name?.trim();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const company = await db.company.create({
    data: {
      name,
      slug,
      industry: body?.industry || undefined,
      primaryColor: body?.primaryColor || undefined,
    },
  });

  return NextResponse.json({ company }, { status: 201 });
}
