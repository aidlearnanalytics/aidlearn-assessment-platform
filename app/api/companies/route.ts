import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "COMPANY_ADMIN"];

export async function GET() {
  try {
    await requireRole(ADMIN_ROLES);
    const companies = await db.company.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { participants: true, assessments: true },
        },
      },
    });
    return NextResponse.json({ companies });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(ADMIN_ROLES);
    const body = await req.json();
    const { name, industry } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Company name is required." }, { status: 400 });
    }

    const cleanName = name.trim();
    // Generate clean slug
    const baseSlug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    // Create Company
    const company = await db.company.create({
      data: {
        name: cleanName,
        slug,
        industry: industry?.trim() || undefined,
        primaryColor: "#1d4ed8",
      },
    });

    // Automatically create a default published Assessment for this company
    const assessment = await db.assessment.create({
      data: {
        name: `${cleanName} - Technical & Analytics Assessment`,
        description: `Custom skills diagnostic evaluation tailored for ${cleanName}.`,
        companyId: company.id,
        durationMinutes: 45,
        numQuestions: 15,
        passingScorePct: 70,
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({ company, assessment }, { status: 201 });
  } catch (err: any) {
    console.error("Create Company Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create company" },
      { status: 500 }
    );
  }
}
