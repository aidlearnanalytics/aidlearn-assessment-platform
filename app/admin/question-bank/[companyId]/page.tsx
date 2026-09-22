import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import CompanyQuestionBankView from "@/components/admin/CompanyQuestionBankView";

export const dynamic = "force-dynamic";

export default async function CompanyQuestionBankPage({
  params,
}: {
  params: { companyId: string };
}) {
  let company: any = null;
  let questions: any[] = [];

  try {
    company = await db.company.findUnique({
      where: { id: params.companyId },
    });

    if (company) {
      questions = await db.question.findMany({
        include: {
          skill: true,
          category: true,
          createdBy: { select: { name: true, email: true } },
          approvedBy: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }).catch(() => []);
    }
  } catch (err) {
    console.error("Failed to load question bank data:", err);
  }

  if (!company) {
    notFound();
  }

  return (
    <CompanyQuestionBankView
      company={{
        ...company,
        questions,
      }}
    />
  );
}
