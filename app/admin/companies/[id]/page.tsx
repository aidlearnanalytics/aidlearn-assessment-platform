import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import CompanyDetailView from "@/components/admin/CompanyDetailView";

export const dynamic = "force-dynamic";

export default async function CompanyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let company: any = null;
  try {
    company = await db.company.findUnique({
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
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });
  } catch (err) {
    console.error("Failed to load company details:", err);
  }

  if (!company) {
    notFound();
  }

  return <CompanyDetailView company={company} />;
}
