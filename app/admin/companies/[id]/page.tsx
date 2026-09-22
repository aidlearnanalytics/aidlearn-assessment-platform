import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import CompanyDetailView from "@/components/admin/CompanyDetailView";

export const dynamic = "force-dynamic";

export default async function CompanyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const company = await db.company.findUnique({
    where: { id: params.id },
    include: {
      assessments: {
        include: {
          questions: { select: { id: true } },
        },
      },
      participants: {
        include: {
          attempts: {
            include: {
              violations: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!company) {
    notFound();
  }

  return <CompanyDetailView company={company} />;
}
