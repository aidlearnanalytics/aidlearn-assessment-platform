import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import CompanyQuestionBankView from "@/components/admin/CompanyQuestionBankView";

export const dynamic = "force-dynamic";

export default async function CompanyQuestionBankPage({
  params,
}: {
  params: { companyId: string };
}) {
  const company = await db.company.findUnique({
    where: { id: params.companyId },
  });

  if (!company) {
    notFound();
  }

  const questions = await db.question.findMany({
    include: {
      skill: true,
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const companyWithQuestions = {
    ...company,
    questions,
  };

  return <CompanyQuestionBankView company={companyWithQuestions as any} />;
}
