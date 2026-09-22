import { db } from "@/lib/db";
import CompanyListWithModal from "@/components/admin/CompanyListWithModal";

export const dynamic = "force-dynamic";

export default async function AdminCompaniesPage() {
  let companies: any[] = [];
  try {
    companies = await db.company.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            participants: true,
            assessments: true,
          },
        },
      },
    });
  } catch (err) {
    console.error("Failed to load companies in admin:", err);
  }

  return <CompanyListWithModal companies={companies} />;
}
