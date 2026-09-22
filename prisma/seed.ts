// Stage 1 seed: one super admin so you can log in and see the dashboard.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("changeme123", 10);
  await db.adminUser.upsert({
    where: { email: "admin@aidlearn.com" },
    update: {},
    create: {
      email: "admin@aidlearn.com",
      passwordHash,
      name: "AidLearn Admin",
      role: "SUPER_ADMIN",
    },
  });
  console.log("Seeded admin@aidlearn.com / changeme123 — change this password after first login.");
}

main().finally(() => db.$disconnect());
