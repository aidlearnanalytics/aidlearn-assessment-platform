import { db } from "@/lib/db";
import CompanyListWithModal from "@/components/admin/CompanyListWithModal";

export const dynamic = "force-dynamic";

export default async function AdminCompaniesPage() {
  const companies = await db.company.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          participants: true,
          assessments: true,
          questions: true,
        },
      },
    },
  });

  return <CompanyListWithModal companies={companies} />;
}
