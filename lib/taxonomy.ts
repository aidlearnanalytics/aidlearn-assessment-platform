import { db } from "@/lib/db";

export async function findOrCreateSkill(name: string) {
  const trimmed = name.trim();
  return db.skill.upsert({
    where: { name: trimmed },
    update: {},
    create: { name: trimmed },
  });
}

export async function findOrCreateCategory(name?: string) {
  if (!name || !name.trim()) return null;
  const trimmed = name.trim();
  return db.category.upsert({
    where: { name: trimmed },
    update: {},
    create: { name: trimmed },
  });
}
