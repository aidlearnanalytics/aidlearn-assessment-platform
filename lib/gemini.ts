import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export interface GeneratedQuestion {
  prompt: string;
  type: "MULTIPLE_CHOICE" | "MULTIPLE_SELECT" | "TRUE_FALSE" | "SHORT_ANSWER" | "FORMULA_ENTRY";
  options?: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer?: string;
  explanation: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  points: number;
  skillName: string;
  categoryName?: string;
}

export async function generateQuestionsWithGemini(params: {
  topic: string;
  industry?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  numQuestions: number;
  notes?: string;
}): Promise<GeneratedQuestion[]> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `You are a world-class financial analytics and workplace skills assessment author for AidLearn Analytics.
Generate ${params.numQuestions} high-quality, practical assessment questions on the topic "${params.topic}".
Industry Context: ${params.industry || "Financial Services & Analytics"}
Difficulty Level: ${params.difficulty}
${params.notes ? `Additional Curriculum / Custom Notes to include:\n${params.notes}\n` : ""}

Requirements:
- Questions should test real job capabilities (Excel formulas, financial logic, SQL queries, business data reasoning, etc.).
- Produce realistic scenarios.
- Question types can be "MULTIPLE_CHOICE" (single correct), "MULTIPLE_SELECT" (multiple correct), "TRUE_FALSE", "SHORT_ANSWER", or "FORMULA_ENTRY".
- For MULTIPLE_CHOICE and MULTIPLE_SELECT, provide at least 4 options with exact boolean "isCorrect".
- For FORMULA_ENTRY or SHORT_ANSWER, provide the exact formula or text in "correctAnswer".
- Provide clear, insightful "explanation" for why the answer is correct.

Output JSON Format strictly matching this schema:
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
    "difficulty": "${params.difficulty}",
    "points": 1,
    "skillName": "Excel",
    "categoryName": "${params.topic}"
  }
]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err: any) {
    console.error("Gemini Question Generation Error:", err);
    throw new Error(err.message || "Failed to generate questions with AI");
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
      model: "gemini-3.6-flash",
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
    return JSON.parse(text) as CandidateAIDiagnostic;
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
