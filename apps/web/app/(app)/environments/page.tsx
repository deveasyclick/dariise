import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { EnvironmentGrid } from "@/components/app/environments/environment-cards";
import { FlagCoverageCard } from "@/components/app/environments/coverage";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import {
  getEnvironments,
  getFlagCoverage,
} from "@/lib/environment-data";

export const metadata: Metadata = {
  title: "Environments",
  description:
    "Isolated flag configurations with separate API keys, endpoints, and audit trails.",
};

export const dynamic = "force-dynamic";

export default function EnvironmentsPage() {
  // One `now` for the whole render keeps server output and hydration in step.
  const now = new Date();
  const environments = getEnvironments(now);
  const coverage = getFlagCoverage(now);

  return (
    <>
      <PageHeader
        title="Environments"
        description="Isolated flag configurations with separate API keys, endpoints, and audit trails."
      >
        <Button asChild size="sm" className="gap-1.5 text-[11px]">
          <Link href="/environments/new">
            <PlusIcon aria-hidden="true" className="size-3.5" />
            New Environment
          </Link>
        </Button>
      </PageHeader>

      <EnvironmentGrid environments={environments} />

      <FlagCoverageCard environments={environments} rows={coverage} />
    </>
  );
}
