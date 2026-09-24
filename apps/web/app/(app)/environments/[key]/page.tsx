import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnvironmentDangerCard } from "@/components/app/environments/environment-cards";
import { EnvironmentDetailHeader } from "@/components/app/environments/environment-headers";
import {
  EndpointsCard,
  SdkKeysCard,
} from "@/components/app/environments/environment-keys";
import { EnvironmentSettingsCard } from "@/components/app/environments/environment-settings";
import { EnvironmentTabs } from "@/components/app/environments/environment-tabs";
import * as api from "@/lib/api";
import { getScope } from "@/lib/scope";
import { findEnvironment } from "./load-environment";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/environments/[key]">,
): Promise<Metadata> {
  const { key } = await props.params;
  const { project } = await getScope();

  if (!project) return { title: "Environment" };

  const environment = await findEnvironment(project.key, key);

  return environment
    ? {
        title: `${environment.name} · Environments`,
        description: `SDK keys, endpoints, and settings for ${environment.name}.`,
      }
    : { title: "Not found" };
}

/** SDK keys tab — the default view for an environment. */
export default async function EnvironmentKeysPage(
  props: PageProps<"/environments/[key]">,
) {
  const { key } = await props.params;
  const { project } = await getScope();

  if (!project) notFound();

  const environment = await findEnvironment(project.key, key);
  if (!environment) notFound();

  const keyPage = await api.apiKeys.list(project.key);
  const keys = keyPage.data.filter(
    (apiKey) =>
      apiKey.environmentKey === environment.key ||
      apiKey.environmentKey === null,
  );

  return (
    <>
      <EnvironmentDetailHeader environment={environment} />
      <EnvironmentTabs environmentKey={environment.key} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.5fr)]">
        <div className="space-y-4">
          <SdkKeysCard
            keys={keys}
            maskedKey={environment.connection.maskedKey}
            truncated={keyPage.nextCursor !== null}
          />
          <EndpointsCard connection={environment.connection} />
        </div>

        <div className="space-y-4">
          <EnvironmentSettingsCard
            projectKey={project.key}
            environment={environment}
          />
          <EnvironmentDangerCard />
        </div>
      </div>
    </>
  );
}
