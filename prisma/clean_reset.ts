import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database to a fresh state...");

  // Delete all transactional and relational data
  await prisma.violationLog.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.assessmentAttempt.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.assessmentQuestion.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.question.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.category.deleteMany();
  await prisma.company.deleteMany();

  // Create clean Super Admin
  const passwordHash = await bcrypt.hash("changeme123", 10);
  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@aidlearn.com" },
    update: {
      passwordHash,
      role: "SUPER_ADMIN",
      name: "AidLearn Admin",
    },
    create: {
      id: "admin-super",
      email: "admin@aidlearn.com",
      passwordHash,
      name: "AidLearn Admin",
      role: "SUPER_ADMIN",
    },
  });

  console.log("Database reset complete! Clean slate initialized with Super Admin:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
