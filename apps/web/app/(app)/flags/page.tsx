import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon, UploadIcon } from "lucide-react";
import { FlagsTable } from "@/components/app/flags-table";
import { listWorkspaceFlags } from "@/components/app/flags/flag-queries";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { getScope } from "@/lib/scope";

export const metadata: Metadata = {
  title: "Feature Flags",
  description: "Manage feature flags across your environments.",
};

export const dynamic = "force-dynamic";

export default async function FeatureFlagsPage() {
  const now = new Date();
  const [{ project, environment }, flags] = await Promise.all([
    getScope(),
    listWorkspaceFlags(),
  ]);

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
        flags={flags}
        projectKey={project?.key ?? null}
        environmentKey={environment?.key ?? null}
        environmentName={environment?.name ?? null}
        now={now.toISOString()}
      />
    </>
  );
}
