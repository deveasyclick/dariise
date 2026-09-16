import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { ApiKeyTable } from "@/components/app/api-keys/api-key-table";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { getApiKeys } from "@/lib/api-key-data";
import { getEnvironmentOptions } from "@/lib/environment-data";

export const metadata: Metadata = {
  title: "API Keys",
  description: "Authenticate SDK clients and CI jobs against each environment.",
};

export const dynamic = "force-dynamic";

export default function ApiKeysPage() {
  // One `now` for the whole render keeps server output and hydration in step.
  const keys = getApiKeys(new Date());

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

      <ApiKeyTable keys={keys} environments={getEnvironmentOptions()} />
    </>
  );
}
