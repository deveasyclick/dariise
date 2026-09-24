import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { ApiKeyTable } from "@/components/app/api-keys/api-key-table";
import {
  toApiKeyView,
  toEnvironmentOptions,
} from "@/components/app/api-keys/api-key-view";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { apiKeys } from "@/lib/api";
import { getScope } from "@/lib/scope";

export const metadata: Metadata = {
  title: "API Keys",
  description: "Authenticate SDK clients and CI jobs against each environment.",
};

export const dynamic = "force-dynamic";

export default async function ApiKeysPage() {
  const { project, environments } = await getScope();

  if (!project) notFound();

  const now = new Date();
  const page = await apiKeys.list(project.key);
  const environmentOptions = toEnvironmentOptions(environments);
  const keys = page.data.map((key) =>
    toApiKeyView(key, environmentOptions, now),
  );

  return (
    <>
      <PageHeader
        title="API Keys"
        description="Authenticate SDK clients and CI jobs against each environment."
      >
        <Button asChild size="sm" className="gap-1.5 text-[11px]">
          <Link href="/api-keys/new">
            <PlusIcon aria-hidden="true" className="size-3.5" />
            Create API Key
          </Link>
        </Button>
      </PageHeader>

      <ApiKeyTable
        projectKey={project.key}
        keys={keys}
        environments={environmentOptions}
        now={now.toISOString()}
        truncated={page.nextCursor !== null}
      />
    </>
  );
}
