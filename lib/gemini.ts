import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export interface GeneratedQuestion {
  prompt: string;
  type: string;
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
  correctAnswer?: string;
  explanation?: string;
  difficulty: string;
  points?: number;
  skillName?: string;
  categoryName?: string;
}

// Fallback question generator when offline or API limit reached
function generateFallbackQuestions(topic: string, difficulty: string, count: number): GeneratedQuestion[] {
  const diff = difficulty.toUpperCase();
  const pool = [
    {
      prompt: `In advanced financial modeling for ${topic}, what is the primary advantage of utilizing dynamic array formulas (such as XLOOKUP, FILTER, or UNIQUE) over legacy CSE formulas?`,
      type: "MULTIPLE_CHOICE",
      options: [
        { id: "1", text: "They spill automatically into adjacent cells without requiring Ctrl+Shift+Enter", isCorrect: true },
        { id: "2", text: "They permanently lock spreadsheet cells against user modification", isCorrect: false },
        { id: "3", text: "They require workbook macro permissions (.xlsm) to calculate", isCorrect: false },
        { id: "4", text: "They only compute when recalculate workbook is triggered manually", isCorrect: false }
      ],
      explanation: "Dynamic array formulas automatically spill calculated outputs to neighboring ranges, eliminating legacy CSE constraints.",
      difficulty: diff,
      points: 1,
      skillName: "Financial Modeling",
      categoryName: topic
    },
    {
      prompt: `When analyzing dataset distributions in ${topic}, which function provides an exact two-way match without requiring sorting of the lookup table?`,
      type: "MULTIPLE_CHOICE",
      options: [
        { id: "1", text: "INDEX paired with double MATCH (row and column)", isCorrect: true },
        { id: "2", text: "HLOOKUP with approximate lookup set to TRUE", isCorrect: false },
        { id: "3", text: "VLOOKUP with column index hardcoded to 1", isCorrect: false },
        { id: "4", text: "OFFSET with volatile volatile cell pointers", isCorrect: false }
      ],
      explanation: "INDEX with dual MATCH enables robust 2D matrix lookups that do not depend on ordered columns or fragile column indexes.",
      difficulty: diff,
      points: 1,
      skillName: "Analytics",
      categoryName: topic
    },
    {
      prompt: `In relational SQL analytics related to ${topic}, what is the key difference between ROW_NUMBER(), RANK(), and DENSE_RANK()?`,
      type: "MULTIPLE_CHOICE",
      options: [
        { id: "1", text: "DENSE_RANK does not leave gaps in numbering after ties, whereas RANK leaves gaps", isCorrect: true },
        { id: "2", text: "ROW_NUMBER assigns duplicate numbers when values tie", isCorrect: false },
        { id: "3", text: "RANK only operates on string columns", isCorrect: false },
        { id: "4", text: "DENSE_RANK requires an explicit GROUP BY clause in the outer query", isCorrect: false }
      ],
      explanation: "RANK leaves sequential gaps following tied values (e.g. 1, 2, 2, 4), while DENSE_RANK continues without gaps (1, 2, 2, 3).",
      difficulty: diff,
      points: 1,
      skillName: "SQL & Analytics",
      categoryName: topic
    },
    {
      prompt: `When evaluating capital budgeting cash flows under ${topic}, why is XIRR generally preferred over standard IRR for real-world projects?`,
      type: "MULTIPLE_CHOICE",
      options: [
        { id: "1", text: "XIRR accounts for non-periodic, exact-date cash flows rather than strictly periodic intervals", isCorrect: true },
        { id: "2", text: "XIRR calculates nominal returns without factoring in discount rates", isCorrect: false },
        { id: "3", text: "XIRR automatically guarantees a positive net present value", isCorrect: false },
        { id: "4", text: "XIRR is only applicable to government bond yields", isCorrect: false }
      ],
      explanation: "XIRR allows irregular calendar dates for each cash flow event, reflecting realistic transaction timing.",
      difficulty: diff,
      points: 1,
      skillName: "Corporate Finance",
      categoryName: topic
    },
    {
      prompt: `In business intelligence dashboards for ${topic}, what is the recommended practice to prevent circular dependencies in data models?`,
      type: "MULTIPLE_CHOICE",
      options: [
        { id: "1", text: "Establish a clear star-schema architecture with one-to-many relationships from dimensions to fact tables", isCorrect: true },
        { id: "2", text: "Link every table to every other table bidirectionally", isCorrect: false },
        { id: "3", text: "Flatten all tables into a single unstructured worksheet without foreign keys", isCorrect: false },
        { id: "4", text: "Disable query relationships and use manual lookups for all visuals", isCorrect: false }
      ],
      explanation: "Star schemas maintain single-direction filtering from dimension tables to fact tables, avoiding ambiguity and circular paths.",
      difficulty: diff,
      points: 1,
      skillName: "Business Intelligence",
      categoryName: topic
    }
  ];

  const results: GeneratedQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const base = pool[i % pool.length];
    results.push({
      ...base,
      prompt: `[${topic} - Q${i + 1}] ${base.prompt}`,
      points: 1,
      difficulty: diff,
      categoryName: topic
    });
  }
  return results;
}

// Single chunk generator (up to 10 questions per prompt for maximum output fidelity)
async function generateQuestionChunk(params: {
  topic: string;
  industry?: string;
  difficulty?: string;
  chunkSize: number;
  batchIndex: number;
  totalBatches: number;
  notes?: string;
}): Promise<GeneratedQuestion[]> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `You are an expert assessment designer and senior financial analytics tutor at AidLearn Analytics.
Generate ${params.chunkSize} high-quality, practical assessment questions for candidates.

Topic / Skill: ${params.topic}
Industry Context: ${params.industry || "Financial Services & Business Analytics"}
Target Difficulty: ${params.difficulty || "INTERMEDIATE"}
Batch: ${params.batchIndex + 1} of ${params.totalBatches}
${params.notes ? `Additional Custom Syllabus / Company Focus: "${params.notes}"` : ""}

Instructions:
- Provide realistic business problems, financial modeling scenarios, formulas, data aggregation challenges, or analytical interpretation.
- Exactly ${params.chunkSize} distinct questions.
- For MULTIPLE_CHOICE questions, provide exactly 4 options with only ONE correct answer (isCorrect: true).
- Make distractor options plausible and educational.
- Provide a clear, insightful "explanation" for why the answer is correct.

Output JSON Format strictly matching this array schema:
[
  {
    "prompt": "Question text...",
    "type": "MULTIPLE_CHOICE",
    "options": [
      { "id": "1", "text": "Option A text", "isCorrect": false },
      { "id": "2", "text": "Option B text", "isCorrect": true },
      { "id": "3", "text": "Option C text", "isCorrect": false },
      { "id": "4", "text": "Option D text", "isCorrect": false }
    ],
    "correctAnswer": "Optional for formula/short answer",
    "explanation": "Detailed explanation...",
    "difficulty": "${params.difficulty || "INTERMEDIATE"}",
    "points": 1,
    "skillName": "Analytics",
    "categoryName": "${params.topic}"
  }
]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  // Clean markdown fences if any
  const cleaned = text.replace(/^```json/m, "").replace(/^```/m, "").trim();
  const parsed = JSON.parse(cleaned);
  return Array.isArray(parsed) ? parsed : [parsed];
}

export async function generateQuestionsWithGemini(params: {
  topic: string;
  industry?: string;
  difficulty?: string;
  numQuestions?: number;
  notes?: string;
}): Promise<GeneratedQuestion[]> {
  const totalCount = Math.max(Number(params.numQuestions) || 5, 1);
  const CHUNK_SIZE = 10;
  const chunkSizes: number[] = [];
  
  let remaining = totalCount;
  while (remaining > 0) {
    const nextChunk = Math.min(remaining, CHUNK_SIZE);
    chunkSizes.push(nextChunk);
    remaining -= nextChunk;
  }

  try {
    // Generate chunks in parallel
    const chunkPromises = chunkSizes.map((size, idx) =>
      generateQuestionChunk({
        topic: params.topic,
        industry: params.industry,
        difficulty: params.difficulty,
        chunkSize: size,
        batchIndex: idx,
        totalBatches: chunkSizes.length,
        notes: params.notes,
      })
    );

    const chunkResults = await Promise.all(chunkPromises);
    const allQuestions: GeneratedQuestion[] = [];
    chunkResults.forEach((chunk) => {
      if (Array.isArray(chunk)) {
        allQuestions.push(...chunk);
      }
    });

    if (allQuestions.length === 0) {
      return generateFallbackQuestions(params.topic, params.difficulty || "INTERMEDIATE", totalCount);
    }

    return allQuestions.slice(0, totalCount);
  } catch (err: any) {
    console.error("Gemini Question Generation Error, utilizing fallback pool:", err?.message || err);
    return generateFallbackQuestions(params.topic, params.difficulty || "INTERMEDIATE", totalCount);
  }
}

export interface CandidateAIDiagnostic {
  headline: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendedCurriculum: string[];
  learningActionPlan: string;
}

export async function generateCandidateDiagnostic(params: {
  candidateName: string;
  companyName: string;
  overallScore: number;
  overallPct: number;
  totalQuestions: number;
  correctCount: number;
  categoryScores: Record<string, number>;
  questionsSummary: Array<{
    prompt: string;
    skill: string;
    category?: string;
    isCorrect: boolean;
    candidateAnswer: any;
    explanation?: string;
  }>;
}): Promise<CandidateAIDiagnostic> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `You are the Lead Talent Assessor and AI Learning Advisor at AidLearn Analytics.
Evaluate the following candidate's skills assessment performance and generate a constructive, highly personalized diagnostic report.

Candidate: ${params.candidateName}
Company: ${params.companyName}
Overall Score: ${params.overallScore} (${params.overallPct.toFixed(1)}%)
Questions Answered: ${params.correctCount} / ${params.totalQuestions}
Category Scores: ${JSON.stringify(params.categoryScores)}

Question Breakdown Summary:
${JSON.stringify(params.questionsSummary, null, 2)}

Provide an honest, professional diagnostic:
1. Headline (e.g. "Solid Foundation in Core Functions, Critical Gaps in Advanced Financial Logic")
2. Summary paragraph: clear feedback on how they fared (good, average, or low).
3. Specific Strengths (bullet points of what they understood well).
4. Specific Weaknesses / Skill Gaps (bullet points of formulas/concepts missed).
5. Recommended AidLearn Analytics Training Modules (what they should learn next).
6. Learning Action Plan / Call to action showing how joining AidLearn's corporate training programs bridges these exact gaps.

Output JSON Format strictly matching:
{
  "headline": "...",
  "summary": "...",
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "recommendedCurriculum": ["...", "..."],
  "learningActionPlan": "..."
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/^```json/m, "").replace(/^```/m, "").trim();
    return JSON.parse(cleaned) as CandidateAIDiagnostic;
  } catch (err) {
    console.error("Gemini Candidate Diagnostic Error:", err);
    const pct = params.overallPct;
    return {
      headline: pct >= 70 ? "Commendable Assessment Performance" : pct >= 50 ? "Moderate Technical Competence with Key Gaps" : "Foundational Upskilling Recommended",
      summary: `You completed the assessment with a score of ${pct.toFixed(0)}%. While demonstrating core capabilities, there are key areas in modern analytical modeling that require structured reinforcement.`,
      strengths: ["Demonstrated familiarity with standard workflows and basic problem solving."],
      weaknesses: ["Advanced lookup mechanics and complex calculation optimization."],
      recommendedCurriculum: ["AidLearn Advanced Financial Modeling", "Excel Dynamic Arrays & Masterclass", "SQL for Business Intelligence"],
      learningActionPlan: "Enroll in AidLearn Analytics corporate training to turn these identified weaknesses into high-performance strengths.",
    };
  }
}

export async function generateAIDiagnostic(params: any) {
  return generateCandidateDiagnostic({
    candidateName: params.candidateName || 'Candidate',
    companyName: params.assessmentTitle || 'AidLearn Analytics',
    overallScore: params.overallScore || 0,
    overallPct: params.overallPct || 0,
    totalQuestions: params.detailedResponses?.length || 0,
    correctCount: params.detailedResponses?.filter((r: any) => r.isCorrect)?.length || 0,
    categoryScores: params.categoryScores || {},
    questionsSummary: (params.detailedResponses || []).map((r: any) => ({
      prompt: r.prompt,
      skill: r.category || 'General',
      category: r.category,
      isCorrect: r.isCorrect,
      candidateAnswer: r.candidateAnswer,
      explanation: r.explanation
    }))
  });
}
