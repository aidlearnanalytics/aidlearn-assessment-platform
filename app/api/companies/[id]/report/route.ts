import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";
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
  BorderStyle,
} from "docx";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "COMPANY_ADMIN", "REVIEWER"];

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(ADMIN_ROLES);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const company = await db.company.findUnique({
    where: { id: params.id },
    include: {
      participants: {
        include: {
          attempts: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              answers: {
                include: { question: true },
              },
              violations: true,
            },
          },
        },
      },
      assessments: {
        include: {
          questions: {
            include: { question: true },
          },
        },
      },
    },
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const totalParticipants = company.participants.length;
  const allAttempts = company.participants
    .map((p) => p.attempts[0])
    .filter((a): a is NonNullable<typeof a> => !!a && (a.status === "SUBMITTED" ));

  const completedCount = allAttempts.length;

  const avgScore =
    completedCount > 0
      ? Math.round(allAttempts.reduce((sum, att) => sum + (att.overallPct || 0), 0) / completedCount)
      : 0;

  const passedCount = allAttempts.filter((att) => (att.overallPct || 0) >= 70).length;
  const passRate = completedCount > 0 ? Math.round((passedCount / completedCount) * 100) : 0;

  // Synthesize executive commentary using Gemini 3.6 Flash
  let aiExecutiveSummary = `The corporate technical assessment for ${company.name} reveals strong operational aptitude alongside clear, strategic opportunities for optimization in advanced financial modeling, query structuring, and automated business intelligence workflows.`;

  try {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

      const prompt = `You are the Lead Corporate Training Director and Executive Analytics Consultant at AidLearn Analytics.
Generate an executive commentary and corporate capability analysis for a formal client deliverable:
Client Name: ${company.name}
Industry: ${company.industry || "Corporate Enterprise"}
Total Candidates Evaluated: ${totalParticipants}
Completed Submissions: ${completedCount}
Organizational Average Score: ${avgScore}%
Pass Rate (>=70%): ${passRate}%

Write a polished, 3-paragraph executive diagnostic:
Paragraph 1: Executive Findings and overall competency baseline of the organization.
Paragraph 2: Capability Strengths and critical technical gap areas identified during assessment.
Paragraph 3: Strategic Training Roadmap and recommendations for corporate training intervention with AidLearn Analytics.`;

      const res = await model.generateContent(prompt);
      const text = res.response.text();
      if (text) aiExecutiveSummary = text;
    }
  } catch (err) {
    console.error("Gemini Report Generation Error:", err);
  }

  // Build Word Document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header / Title
          new Paragraph({
            text: "AIDLEARN ANALYTICS",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `Executive Corporate Capability & Assessment Report`,
            heading: HeadingLevel.TITLE,
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Prepared for: ${company.name}  |  Industry: ${company.industry || "Enterprise"}  |  Date: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
                italics: true,
              }),
            ],
            spacing: { after: 300 },
          }),

          // Executive Summary Section
          new Paragraph({
            text: "1. Executive Summary & Assessment Overview",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 150 },
          }),
          new Paragraph({
            text: aiExecutiveSummary,
            spacing: { after: 250 },
          }),

          // Section 2: Key Metrics Table
          new Paragraph({
            text: "2. Organizational Performance Metrics",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 150 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Evaluation Metric", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Benchmark Result", bold: true })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Total Registered Candidates")] }),
                  new TableCell({ children: [new Paragraph(`${totalParticipants}`)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Completed Assessment Attempts")] }),
                  new TableCell({ children: [new Paragraph(`${completedCount}`)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Organizational Mean Score")] }),
                  new TableCell({ children: [new Paragraph(`${avgScore}%`)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Competency Pass Rate (Benchmark >= 70%)")] }),
                  new TableCell({ children: [new Paragraph(`${passRate}%`)] }),
                ],
              }),
            ],
          }),

          // Section 3: Candidate Roster & Scores
          new Paragraph({
            text: "3. Candidate Assessment Breakdown",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Candidate Name", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Department", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Score", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Proctoring Integrity", bold: true })] })] }),
                ],
              }),
              ...company.participants.map((p) => {
                const att = p.attempts[0];
                const scorePct = att?.overallPct !== null && att?.overallPct !== undefined ? `${Math.round(att.overallPct)}%` : "N/A";
                const passed = (att?.overallPct || 0) >= 70;
                const violations = att?.violations?.length || 0;

                return new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(p.fullName)] }),
                    new TableCell({ children: [new Paragraph(p.department || "General")] }),
                    new TableCell({ children: [new Paragraph(scorePct)] }),
                    new TableCell({ children: [new Paragraph(att ? (passed ? "Passed" : "Needs Upskilling") : "Not Started")] }),
                    new TableCell({ children: [new Paragraph(violations === 0 ? "Clean (0 Flags)" : `${violations} Flags`)] }),
                  ],
                });
              }),
            ],
          }),

          // Section 4: Recommended Strategic Interventions
          new Paragraph({
            text: "4. Recommended Corporate Training Interventions",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Based on the diagnostic findings above, AidLearn Analytics recommends the following structured training pathways for your team:",
              }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            text: "• Executive & Advanced Financial Modeling Masterclass: Accelerates complex valuation, forecasting, dynamic scenario analysis, and executive board-ready dashboarding.",
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: "• Enterprise Business Intelligence & Power BI: Bridges the gap between raw corporate spreadsheets and automated, self-refreshing interactive dashboards.",
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: "• SQL & Data Architecture for Finance & Operations: Empowers staff to query enterprise databases directly and automate repetitive month-end data consolidation.",
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "For customized cohort scheduling, executive briefing sessions, or LMS integration, visit aidlearnanalytics.com/courses or contact the AidLearn Enterprise Advisory Team.",
                italics: true,
              }),
            ],
            spacing: { before: 150, after: 100 },
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const cleanName = company.name.replace(/[^a-zA-Z0-9]+/g, "-");

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${cleanName}-AidLearn-Executive-Report.docx"`,
    },
  });
}
