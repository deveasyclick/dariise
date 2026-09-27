import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiKeyTable } from "@/components/app/api-keys/api-key-table";
import { CreateApiKeyDialog } from "@/components/app/api-keys/create-api-key-dialog";
import {
  toApiKeyView,
  toEnvironmentOptions,
} from "@/components/app/api-keys/api-key-view";
import { PageHeader } from "@/components/app/page-header";
import { apiKeys } from "@/lib/api";
import { getScope } from "@/lib/scope";

export const metadata: Metadata = {
  title: "API Keys",
  description: "Authenticate SDK clients and CI jobs against each environment.",
};

export const dynamic = "force-dynamic";

export default async function ApiKeysPage() {
  const { project, environments, environment } = await getScope();

  if (!project || !environment) notFound();

  const now = new Date();
  // Keys of the environment the dashboard is scoped to, plus the project-wide
  // ones that authenticate in it: a key is issued into one environment, and the
  // chrome already names which.
  const page = await apiKeys.list(project.key, {
    environmentKey: environment.key,
  });
  const environmentOptions = toEnvironmentOptions(environments);
  const keys = page.data.map((key) =>
    toApiKeyView(key, environmentOptions, now),
  );

  return (
    <>
      <PageHeader
        title="API Keys"
        description={`Authenticate SDK clients and CI jobs against ${environment.name}.`}
      >
        <CreateApiKeyDialog
          projectKey={project.key}
          environmentKey={environment.key}
          environmentName={environment.name}
        />
      </PageHeader>

      <ApiKeyTable
        projectKey={project.key}
        keys={keys}
        truncated={page.nextCursor !== null}
      />
    </>
  );
}
