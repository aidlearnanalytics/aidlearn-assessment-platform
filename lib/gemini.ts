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

export const AIDLEARN_OFFICIAL_COURSES = [
  {
    title: "Cohort-Based Training",
    shortTitle: "Cohort",
    focus: "Group learning, live sessions, real datasets, Microsoft Excel, Power BI, and SQL training with 1-month internship",
    bestFor: "Group learners wanting community, structure, and foundational to intermediate analytics mastery."
  },
  {
    title: "Dedicated Training",
    shortTitle: "Dedicated",
    focus: "Personal 1-on-1 live sessions, flexible scheduling, Microsoft Excel, Power BI, SQL, Python or SPSS, LinkedIn optimization, CV revamp, and career coaching",
    bestFor: "Individuals wanting personal mentorship, broader curriculum, and rapid career acceleration."
  },
  {
    title: "Self-Paced Learning",
    shortTitle: "Self-Paced",
    focus: "Structured pre-recorded lesson library, weekly 1-on-1 instructor check-ins, Microsoft Excel, Power BI, and 1-month internship",
    bestFor: "Busy professionals needing schedule flexibility combined with regular instructor accountability."
  },
  {
    title: "Premium Accelerator",
    shortTitle: "Premium Accelerator",
    focus: "Comprehensive elite training: personal live sessions, Microsoft Excel, Power BI, SQL, Python or SPSS, Microsoft certification exam preparation with exam fee paid by AidLearn, career coaching, and 1-month internship",
    bestFor: "Professionals seeking deep career transformation and official Microsoft certification."
  },
  {
    title: "AI Automation",
    shortTitle: "AI Automation",
    focus: "Workflow automation tools, prompt engineering, AI agents and intelligent nodes, APIs, data formatting, and building custom automation tools with project internship",
    bestFor: "Professionals wanting to automate repetitive operations and build AI-powered business tools."
  },
  {
    title: "AI Prompt Engineering",
    shortTitle: "AI Prompt Engineering",
    focus: "Foundational AI and linguistic skills, core prompting frameworks, advanced programmatic workflows, security and safety in AI systems",
    bestFor: "Professionals wanting to master effective, structured communication with modern AI models."
  },
  {
    title: "Computer Basics",
    shortTitle: "Computer Basics",
    focus: "Foundational computer confidence, essential operating skills, and introductory spreadsheet workflows",
    bestFor: "Beginners needing core computing skills before progressing into advanced data tools."
  },
  {
    title: "Corporate Training",
    shortTitle: "Corporate Training",
    focus: "Custom enterprise data analytics, business intelligence dashboards, and AI automation tailored to company datasets, tools, and operational workflows",
    bestFor: "Teams and enterprise organizations upskilling departments at scale."
  }
];

// Fallback question generator when offline or API limit reached
function generateFallbackQuestions(topic: string, difficulty: string, count: number): GeneratedQuestion[] {
  const diff = difficulty.toUpperCase();
  const pool: GeneratedQuestion[] = [
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
        { id: "4", text: "OFFSET with volatile cell pointers", isCorrect: false }
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
        { id: "1", text: "XIRR handles irregular, non-periodic transaction dates while IRR assumes equal periods", isCorrect: true },
        { id: "2", text: "IRR yields multiple rates of return for linear amortization schedules", isCorrect: false },
        { id: "3", text: "XIRR automatically deducts corporate income tax from gross cash flows", isCorrect: false },
        { id: "4", text: "Standard IRR cannot compute positive discount rates", isCorrect: false }
      ],
      explanation: "XIRR maps each cash flow to an exact calendar date, reflecting real irregular investment schedules accurately.",
      difficulty: diff,
      points: 1,
      skillName: "Financial Analysis",
      categoryName: topic
    },
    {
      prompt: `In modern data reporting for ${topic}, what is the primary benefit of Power Query over manual copy-paste spreadsheet consolidation?`,
      type: "MULTIPLE_CHOICE",
      options: [
        { id: "1", text: "It creates an auditable, repeatable ETL pipeline that updates with a single click", isCorrect: true },
        { id: "2", text: "It converts all formulas into irreversible text constants", isCorrect: false },
        { id: "3", text: "It bypasses all cloud security firewalls automatically", isCorrect: false },
        { id: "4", text: "It requires rewriting database schema definitions in C++", isCorrect: false }
      ],
      explanation: "Power Query records data extraction and transformation steps into a repeatable pipeline, eliminating manual data wrangling errors.",
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
      prompt: count > pool.length ? `[${i + 1}] ${base.prompt}` : base.prompt
    });
  }
  return results;
}

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
- Provide a clear, insightful explanation for why the answer is correct.

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

    const officialCoursesFormatted = AIDLEARN_OFFICIAL_COURSES.map(
      (c, i) => `${i + 1}. ${c.title} (Focus: ${c.focus}. Best for: ${c.bestFor})`
    ).join("\n");

    const prompt = `You are the Lead Talent Assessor and AI Learning Advisor at AidLearn Analytics.
Evaluate the following candidate's skills assessment performance and generate a constructive, highly personalized diagnostic report.

Candidate: ${params.candidateName}
Assessment / Company: ${params.companyName}
Overall Score: ${params.overallScore} (${params.overallPct.toFixed(1)}%)
Questions Answered Correctly: ${params.correctCount} / ${params.totalQuestions}
Category Scores: ${JSON.stringify(params.categoryScores)}

Question Breakdown Summary:
${JSON.stringify(params.questionsSummary, null, 2)}

OFFICIAL AIDLEARN ANALYTICS PROGRAMMES:
${officialCoursesFormatted}

CRITICAL RULES FOR RECOMMENDATIONS:
1. In "recommendedCurriculum", you MUST select 2 to 3 of the EXACT official course titles from the list above that directly address the candidate's weaknesses and score level.
2. DO NOT create, hallucinate, or recommend any random, fictional course titles (such as "AidLearn Advanced Financial Modeling" or "Excel Dynamic Arrays & Masterclass"). Use ONLY titles from the official catalogue above (e.g. "Cohort-Based Training", "Dedicated Training", "Self-Paced Learning", "Premium Accelerator", "AI Automation", "AI Prompt Engineering", "Computer Basics", "Corporate Training").
3. DO NOT include any pricing, dollar figures, or fees anywhere in the diagnostic report.
4. Keep the tone encouraging, analytical, and professional.
5. Do NOT use en dashes or em dashes anywhere in your text. Use standard hyphens, colons, or parentheses if needed.

Provide an honest diagnostic in this JSON format strictly matching:
{
  "headline": "Short punchy headline summarizing performance (e.g. Solid Foundation in Core Functions with Growth Priorities in SQL & Automation)",
  "summary": "Clear, constructive 2-3 sentence paragraph detailing their strengths and specific growth areas.",
  "strengths": ["Clear strength 1", "Clear strength 2"],
  "weaknesses": ["Specific skill gap or misconception 1", "Specific skill gap 2"],
  "recommendedCurriculum": ["Official Course Title 1", "Official Course Title 2"],
  "learningActionPlan": "Concise next step showing how completing these official AidLearn Analytics programmes bridges these gaps."
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/^```json/m, "").replace(/^```/m, "").trim();
    const parsed = JSON.parse(cleaned) as CandidateAIDiagnostic;

    // Sanitize recommendedCurriculum to ensure only official titles are present
    if (Array.isArray(parsed.recommendedCurriculum)) {
      parsed.recommendedCurriculum = parsed.recommendedCurriculum.map(rec => {
        const found = AIDLEARN_OFFICIAL_COURSES.find(c => 
          rec.toLowerCase().includes(c.title.toLowerCase()) || 
          rec.toLowerCase().includes(c.shortTitle.toLowerCase())
        );
        return found ? found.title : rec;
      });
    }

    return parsed;
  } catch (err) {
    console.error("Gemini Candidate Diagnostic Error:", err);
    const pct = params.overallPct;

    let fallbackCourses = [
      "Cohort-Based Training",
      "Dedicated Training",
      "AI Automation"
    ];

    if (pct < 40) {
      fallbackCourses = [
        "Computer Basics",
        "Cohort-Based Training",
        "Self-Paced Learning"
      ];
    } else if (pct >= 75) {
      fallbackCourses = [
        "Premium Accelerator",
        "Dedicated Training",
        "AI Automation"
      ];
    }

    return {
      headline: pct >= 70 ? "Commendable Assessment Performance" : pct >= 50 ? "Moderate Technical Competence with Key Growth Priorities" : "Foundational Upskilling Recommended",
      summary: `You completed the assessment with an overall score of ${pct.toFixed(0)}%. While demonstrating foundational knowledge, there are specific areas in modern analytical modeling, formulas, and data architecture that require structured reinforcement.`,
      strengths: ["Demonstrated familiarity with standard workflows and core analytical problem solving."],
      weaknesses: ["Advanced lookup mechanics, data structuring, and dynamic calculation optimization."],
      recommendedCurriculum: fallbackCourses,
      learningActionPlan: "Enroll in AidLearn Analytics official training programmes to turn these identified growth areas into high-performance professional strengths.",
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
