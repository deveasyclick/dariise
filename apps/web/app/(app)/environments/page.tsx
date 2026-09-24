import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import {
  EnvironmentGrid,
  type EnvironmentCardData,
} from "@/components/app/environments/environment-cards";
import { environmentFlagCounts } from "@/components/app/environments/capped-count";
import { FlagCoverageCard } from "@/components/app/environments/coverage";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import * as api from "@/lib/api";
import { getScope } from "@/lib/scope";

export const metadata: Metadata = {
  title: "Environments",
  description:
    "Isolated flag configurations with separate API keys, endpoints, and audit trails.",
};

export const dynamic = "force-dynamic";

export default async function EnvironmentsPage() {
  const { project, environments } = await getScope();

  if (!project) return null;

  const [flagPage, coveragePage] = await Promise.all([
    api.flags.list(project.key, { limit: 100 }),
    api.environments.coverage(project.key),
  ]);

  const flagsTruncated = flagPage.nextCursor !== null;

  const cards: EnvironmentCardData[] = await Promise.all(
    environments.map(async (environment) => {
      const { connection } = await api.environments.get(
        project.key,
        environment.key,
      );

      return {
        environment,
        connection,
        counts: environmentFlagCounts(
          flagPage.data,
          environment.key,
          flagsTruncated,
        ),
      };
    }),
  );

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

      <EnvironmentGrid environments={cards} />

      <FlagCoverageCard
        environments={environments}
        rows={coveragePage.data}
        truncated={coveragePage.nextCursor !== null}
      />
    </>
  );
}
