import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon, UploadIcon } from "lucide-react";
import { FlagsTable } from "@/components/app/flags-table";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { getDashboardData } from "@/lib/dashboard-data";

export const metadata: Metadata = {
  title: "Feature Flags",
  description: "Manage feature flags across your environments.",
};

export const dynamic = "force-dynamic";

export default function FeatureFlagsPage() {
  const now = new Date();
  const data = getDashboardData(now);

  return (
    <>
      <PageHeader
        title="Feature Flags"
        description="Manage feature flags across your environments."
      >
        <Button
          variant="outline"
          size="sm"
          disabled
          title="Import — coming soon"
          className="gap-1.5 text-[11px]"
        >
          <UploadIcon aria-hidden="true" className="size-3.5" />
          Import
        </Button>
        <Button asChild size="sm" className="gap-1.5 text-[11px]">
          <Link href="/flags/new">
            <PlusIcon aria-hidden="true" className="size-3.5" />
            New Flag
          </Link>
        </Button>
      </PageHeader>

      <FlagsTable
        flags={data.flags}
        environmentLabel={data.environmentLabel}
        now={now.toISOString()}
      />
    </>
  );
}
