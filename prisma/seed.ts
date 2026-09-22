import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding local database...");

  // 0. Super Admin
  const passwordHash = await bcrypt.hash("changeme123", 10);
  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@aidlearn.com" },
    update: {
      passwordHash,
      role: "SUPER_ADMIN",
      name: "AidLearn Super Admin",
    },
    create: {
      id: "admin-super",
      email: "admin@aidlearn.com",
      passwordHash,
      name: "AidLearn Super Admin",
      role: "SUPER_ADMIN",
    },
  });
  console.log("Admin seeded:", admin.email, admin.role);

  // 1. Companies
  const indie = await prisma.company.upsert({
    where: { slug: "indie-finance" },
    update: {
      name: "Indie Finance",
      industry: "Fintech & Banking",
      primaryColor: "#1d4ed8",
    },
    create: {
      id: "comp-indie-finance",
      name: "Indie Finance",
      slug: "indie-finance",
      industry: "Fintech & Banking",
      primaryColor: "#1d4ed8",
    },
  });

  const opay = await prisma.company.upsert({
    where: { slug: "opay" },
    update: {
      name: "OPay",
      industry: "Financial Technology",
      primaryColor: "#059669",
    },
    create: {
      id: "comp-opay",
      name: "OPay",
      slug: "opay",
      industry: "Financial Technology",
      primaryColor: "#059669",
    },
  });

  console.log("Companies seeded:", indie.id, indie.name, opay.id, opay.name);

  // 2. Categories & Skills
  const catAnalytics = await prisma.category.upsert({
    where: { name: "Data Analytics & Engineering" },
    update: {},
    create: {
      id: "cat-data-analytics",
      name: "Data Analytics & Engineering",
    },
  });

  const skillSql = await prisma.skill.upsert({
    where: { name: "SQL & Query Optimization" },
    update: {},
    create: {
      id: "skill-sql",
      name: "SQL & Query Optimization",
    },
  });

  const skillPy = await prisma.skill.upsert({
    where: { name: "Python for Data Analysis" },
    update: {},
    create: {
      id: "skill-python",
      name: "Python for Data Analysis",
    },
  });

  const skillPBI = await prisma.skill.upsert({
    where: { name: "Power BI & DAX Modeling" },
    update: {},
    create: {
      id: "skill-powerbi",
      name: "Power BI & DAX Modeling",
    },
  });

  console.log("Skills seeded:", skillSql.id, skillPy.id, skillPBI.id);

  // 3. Questions
  const q1 = await prisma.question.upsert({
    where: { id: "q-py-1" },
    update: {
      prompt: "Given a DataFrame `df` containing columns `['department', 'salary']`, which snippet returns the average salary per department as a clean Series?",
      type: "MULTIPLE_CHOICE",
      difficulty: "INTERMEDIATE",
      skillId: skillPy.id,
      categoryId: catAnalytics.id,
      options: JSON.stringify([
        { key: "A", text: "df.groupby('department')['salary'].mean()" },
        { key: "B", text: "df.aggregate('department', mean='salary')" },
        { key: "C", text: "df.split('department').avg('salary')" },
        { key: "D", text: "df.mean(by='department', col='salary')" },
      ]),
      correctAnswer: "A",
      explanation: "In pandas, `df.groupby('col1')['col2'].mean()` aggregates the target column by group.",
      points: 10,
      status: "APPROVED",
      source: "HUMAN",
    },
    create: {
      id: "q-py-1",
      prompt: "Given a DataFrame `df` containing columns `['department', 'salary']`, which snippet returns the average salary per department as a clean Series?",
      type: "MULTIPLE_CHOICE",
      difficulty: "INTERMEDIATE",
      skillId: skillPy.id,
      categoryId: catAnalytics.id,
      options: JSON.stringify([
        { key: "A", text: "df.groupby('department')['salary'].mean()" },
        { key: "B", text: "df.aggregate('department', mean='salary')" },
        { key: "C", text: "df.split('department').avg('salary')" },
        { key: "D", text: "df.mean(by='department', col='salary')" },
      ]),
      correctAnswer: "A",
      explanation: "In pandas, `df.groupby('col1')['col2'].mean()` aggregates the target column by group.",
      points: 10,
      status: "APPROVED",
      source: "HUMAN",
    },
  });

  const q2 = await prisma.question.upsert({
    where: { id: "q-sql-1" },
    update: {
      prompt: "Which SQL clause calculates a 7-day trailing average of daily revenue including the current day?",
      type: "MULTIPLE_CHOICE",
      difficulty: "ADVANCED",
      skillId: skillSql.id,
      categoryId: catAnalytics.id,
      options: JSON.stringify([
        { key: "A", text: "AVG(revenue) OVER (PARTITION BY date RANGE BETWEEN 7 PRECEDING AND CURRENT ROW)" },
        { key: "B", text: "AVG(revenue) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)" },
        { key: "C", text: "SUM(revenue) / 7 OVER (ORDER BY date)" },
        { key: "D", text: "TRAILING_AVG(revenue, 7) OVER (ORDER BY date)" },
      ]),
      correctAnswer: "B",
      explanation: "ROWS BETWEEN 6 PRECEDING AND CURRENT ROW computes the average across a 7-row window including the current row.",
      points: 15,
      status: "APPROVED",
      source: "HUMAN",
    },
    create: {
      id: "q-sql-1",
      prompt: "Which SQL clause calculates a 7-day trailing average of daily revenue including the current day?",
      type: "MULTIPLE_CHOICE",
      difficulty: "ADVANCED",
      skillId: skillSql.id,
      categoryId: catAnalytics.id,
      options: JSON.stringify([
        { key: "A", text: "AVG(revenue) OVER (PARTITION BY date RANGE BETWEEN 7 PRECEDING AND CURRENT ROW)" },
        { key: "B", text: "AVG(revenue) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)" },
        { key: "C", text: "SUM(revenue) / 7 OVER (ORDER BY date)" },
        { key: "D", text: "TRAILING_AVG(revenue, 7) OVER (ORDER BY date)" },
      ]),
      correctAnswer: "B",
      explanation: "ROWS BETWEEN 6 PRECEDING AND CURRENT ROW computes the average across a 7-row window including the current row.",
      points: 15,
      status: "APPROVED",
      source: "HUMAN",
    },
  });

  const q3 = await prisma.question.upsert({
    where: { id: "q-pbi-1" },
    update: {
      prompt: "In DAX, how does CALCULATE alter filter context when combined with FILTER(ALL(Table), ...)?",
      type: "MULTIPLE_CHOICE",
      difficulty: "ADVANCED",
      skillId: skillPBI.id,
      categoryId: catAnalytics.id,
      options: JSON.stringify([
        { key: "A", text: "It converts row context into filter context and overrides existing table filters." },
        { key: "B", text: "It disables all relationships in the data model." },
        { key: "C", text: "It restricts queries to DirectQuery mode only." },
        { key: "D", text: "It executes on the frontend client cache." },
      ]),
      correctAnswer: "A",
      explanation: "CALCULATE initiates context transition, transforming active row contexts into filter contexts while applying explicit filter parameters.",
      points: 15,
      status: "APPROVED",
      source: "HUMAN",
    },
    create: {
      id: "q-pbi-1",
      prompt: "In DAX, how does CALCULATE alter filter context when combined with FILTER(ALL(Table), ...)?",
      type: "MULTIPLE_CHOICE",
      difficulty: "ADVANCED",
      skillId: skillPBI.id,
      categoryId: catAnalytics.id,
      options: JSON.stringify([
        { key: "A", text: "It converts row context into filter context and overrides existing table filters." },
        { key: "B", text: "It disables all relationships in the data model." },
        { key: "C", text: "It restricts queries to DirectQuery mode only." },
        { key: "D", text: "It executes on the frontend client cache." },
      ]),
      correctAnswer: "A",
      explanation: "CALCULATE initiates context transition, transforming active row contexts into filter contexts while applying explicit filter parameters.",
      points: 15,
      status: "APPROVED",
      source: "HUMAN",
    },
  });

  console.log("Questions seeded:", q1.id, q2.id, q3.id);

  // 4. Create Published Assessment for Indie Finance and Default
  const assessment = await prisma.assessment.upsert({
    where: { id: "asm-indie-analytics" },
    update: {
      name: "Indie Finance - Data Analytics & Engineering Assessment",
      companyId: indie.id,
      isPublished: true,
    },
    create: {
      id: "asm-indie-analytics",
      name: "Indie Finance - Data Analytics & Engineering Assessment",
      description: "Comprehensive diagnostic assessment measuring Python, SQL, and BI modeling proficiency.",
      companyId: indie.id,
      durationMinutes: 45,
      numQuestions: 3,
      passingScorePct: 70,
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  // Link questions to assessment
  await prisma.assessmentQuestion.upsert({
    where: {
      assessmentId_questionId: {
        assessmentId: assessment.id,
        questionId: q1.id,
      },
    },
    update: {},
    create: {
      assessmentId: assessment.id,
      questionId: q1.id,
      order: 1,
    },
  });

  await prisma.assessmentQuestion.upsert({
    where: {
      assessmentId_questionId: {
        assessmentId: assessment.id,
        questionId: q2.id,
      },
    },
    update: {},
    create: {
      assessmentId: assessment.id,
      questionId: q2.id,
      order: 2,
    },
  });

  await prisma.assessmentQuestion.upsert({
    where: {
      assessmentId_questionId: {
        assessmentId: assessment.id,
        questionId: q3.id,
      },
    },
    update: {},
    create: {
      assessmentId: assessment.id,
      questionId: q3.id,
      order: 3,
    },
  });

  console.log("Assessment created and questions linked successfully! Company ID:", indie.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
