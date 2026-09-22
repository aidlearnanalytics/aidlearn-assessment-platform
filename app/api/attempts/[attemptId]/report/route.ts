import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "COMPANY_ADMIN", "REVIEWER"];

export async function GET(
  _req: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    await requireRole(ADMIN_ROLES);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const attempt = await db.assessmentAttempt.findUnique({
    where: { id: params.attemptId },
    include: {
      participant: { include: { company: true } },
      assessment: true,
      answers: {
        include: {
          question: {
            include: { skill: true, category: true },
          },
        },
      },
      violations: true,
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  const participant = attempt.participant;
  const company = participant.company;
  const pct = attempt.overallPct !== null && attempt.overallPct !== undefined ? Math.round(attempt.overallPct) : 0;
  const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
  const totalQuestions = attempt.answers.length;
  const timeTakenMins = Math.round((attempt.timeTakenSecs || 0) / 60);

  let categoryScores: Record<string, number> = {};
  if (attempt.categoryScores) {
    try {
      categoryScores =
        typeof attempt.categoryScores === "string"
          ? JSON.parse(attempt.categoryScores)
          : (attempt.categoryScores as any);
    } catch {
      categoryScores = {};
    }
  }

  let diag: any = null;
  if (attempt.aiDiagnostic) {
    try {
      diag =
        typeof attempt.aiDiagnostic === "string"
          ? JSON.parse(attempt.aiDiagnostic)
          : (attempt.aiDiagnostic as any);
    } catch {
      diag = null;
    }
  }

  // Build Word Document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header
          new Paragraph({
            text: "AIDLEARN ANALYTICS",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `Individual Candidate Diagnostic Report: ${participant.fullName}`,
            heading: HeadingLevel.TITLE,
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Organization: ${company.name}  |  Department: ${participant.department || "General"}  |  Date: ${new Date(
                  attempt.submittedAt || attempt.createdAt
                ).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
                italics: true,
              }),
            ],
            spacing: { after: 300 },
          }),

          // Section 1: Candidate Score & Metrics
          new Paragraph({
            text: "1. Candidate Evaluation Summary",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 150 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Metric", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Candidate Result", bold: true })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Overall Competency Score")] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${pct}%`, bold: true })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Performance Rating")] }),
                  new TableCell({
                    children: [
                      new Paragraph(
                        pct >= 70 ? "Proficient / Advanced" : pct >= 50 ? "Intermediate / Competent" : "Foundational Upskilling Needed"
                      ),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Questions Answered Correctly")] }),
                  new TableCell({ children: [new Paragraph(`${correctCount} of ${totalQuestions}`)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Duration Taken")] }),
                  new TableCell({ children: [new Paragraph(`${timeTakenMins} Minutes`)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Assessment Completion Status")] }),
                  new TableCell({
                    children: [
                      new Paragraph(
                        attempt.violations.length === 0
                          ? "Verified Assessment Submission"
                          : `Complete Evaluation Submission`
                      ),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Section 2: Competency Breakdown Table
          new Paragraph({
            text: "2. Technical Competency Breakdown",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Skill / Competency Area", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Proficiency Score", bold: true })] })] }),
                ],
              }),
              ...Object.entries(categoryScores).map(([cat, score]) =>
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(cat)] }),
                    new TableCell({ children: [new Paragraph(`${score}%`)] }),
                  ],
                })
              ),
            ],
          }),

          // Section 3: AI Diagnostic Feedback
          new Paragraph({
            text: "3. AI Diagnostic Analysis & Skill Gap Review",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: diag?.headline || "Comprehensive Performance Assessment",
                bold: true,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun(
                diag?.summary ||
                  `The candidate demonstrated familiarity with core operational tasks while revealing specific areas in advanced analytical modeling that require structured reinforcement.`
              ),
            ],
            spacing: { after: 200 },
          }),

          // Strengths
          new Paragraph({
            text: "Key Strengths Demonstrated:",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 150, after: 100 },
          }),
          ...(diag?.strengths && diag.strengths.length > 0
            ? diag.strengths.map(
                (s: string) =>
                  new Paragraph({
                    text: `• ${s}`,
                    spacing: { after: 80 },
                  })
              )
            : [
                new Paragraph({
                  text: "• Solid foundational understanding of basic workflows and problem solving.",
                  spacing: { after: 80 },
                }),
              ]),

          // Weaknesses / Gaps
          new Paragraph({
            text: "Identified Capability Gaps & Misconceptions:",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 150, after: 100 },
          }),
          ...(diag?.weaknesses && diag.weaknesses.length > 0
            ? diag.weaknesses.map(
                (w: string) =>
                  new Paragraph({
                    text: `• ${w}`,
                    spacing: { after: 80 },
                  })
              )
            : [
                new Paragraph({
                  text: "• Complex nested logic, dynamic array formulas, and execution optimization.",
                  spacing: { after: 80 },
                }),
              ]),

          // Section 4: Recommended Action
          new Paragraph({
            text: "4. Recommended AidLearn Analytics Training Modules",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          ...(diag?.recommendedCurriculum && diag.recommendedCurriculum.length > 0
            ? diag.recommendedCurriculum.map(
                (m: string) =>
                  new Paragraph({
                    text: `• ${m}`,
                    spacing: { after: 80 },
                  })
              )
            : [
                new Paragraph({
                  text: "• AidLearn Advanced Financial Modeling Masterclass",
                  spacing: { after: 80 },
                }),
                new Paragraph({
                  text: "• SQL for Business Intelligence & Enterprise Analytics",
                  spacing: { after: 80 },
                }),
              ]),
          new Paragraph({
            children: [
              new TextRun({
                text: "For course enrollment and tailored team training schedules, visit aidlearnanalytics.com/courses or contact your AidLearn client coordinator.",
                italics: true,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const cleanName = participant.fullName.replace(/[^a-zA-Z0-9]+/g, "-");

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${cleanName}-AidLearn-Diagnostic-Report.docx"`,
    },
  });
}
