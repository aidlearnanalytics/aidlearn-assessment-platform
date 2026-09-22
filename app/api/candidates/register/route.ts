import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, name, email, phone, department, companyId } = body;

    const candidateName = fullName || name;

    if (!candidateName || !email || !companyId) {
      return NextResponse.json(
        { error: "Full name, email, and company are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = candidateName.trim();

    // 1. Verify Company exists
    const company = await db.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Selected company does not exist." }, { status: 404 });
    }

    // 2. Find published assessment for this company
    let assessment = await db.assessment.findFirst({
      where: { companyId, isPublished: true },
      include: { questions: true },
      orderBy: { createdAt: "desc" },
    });

    if (!assessment) {
      // Fallback to any created assessment for this company
      assessment = await db.assessment.findFirst({
        where: { companyId },
        include: { questions: true },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!assessment) {
      // Create default assessment if none exists
      assessment = await db.assessment.create({
        data: {
          name: `${company.name} Assessment`,
          companyId: company.id,
          durationMinutes: 45,
          isPublished: true,
        },
        include: { questions: true },
      });
    }

    // 3. Upsert Participant record
    const participant = await db.participant.upsert({
      where: {
        companyId_email: {
          companyId,
          email: cleanEmail,
        },
      },
      update: {
        fullName: cleanName,
        phone: phone || undefined,
        department: department || undefined,
      },
      create: {
        companyId,
        email: cleanEmail,
        fullName: cleanName,
        phone: phone || undefined,
        department: department || undefined,
      },
    });

    // 4. Create new AssessmentAttempt
    const attempt = await db.assessmentAttempt.create({
      data: {
        assessmentId: assessment.id,
        participantId: participant.id,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        attemptId: attempt.id,
        assessmentName: assessment.name,
        durationMinutes: assessment.durationMinutes,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Candidate Registration Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to initiate assessment attempt." },
      { status: 500 }
    );
  }
}
