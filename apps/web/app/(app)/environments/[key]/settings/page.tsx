import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  EnvironmentDangerCard,
  EnvironmentMetadataCard,
  ProtectedEnvironmentsNote,
} from "@/components/app/environments/environment-cards";
import { EnvironmentDetailHeader } from "@/components/app/environments/environment-headers";
import { EnvironmentSettingsCard } from "@/components/app/environments/environment-settings";
import { EnvironmentTabs } from "@/components/app/environments/environment-tabs";
import { getScope } from "@/lib/scope";
import { findEnvironment } from "../load-environment";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/environments/[key]/settings">,
): Promise<Metadata> {
  const { key } = await props.params;
  const { project } = await getScope();

  if (!project) return { title: "Environment" };

  const environment = await findEnvironment(project.key, key);

  return environment
    ? {
        title: `${environment.name} · Settings`,
        description: `Settings for ${environment.name}.`,
      }
    : { title: "Not found" };
}

export default async function EnvironmentSettingsPage(
  props: PageProps<"/environments/[key]/settings">,
) {
  const { key } = await props.params;
  const { project } = await getScope();

  if (!project) notFound();

  const environment = await findEnvironment(project.key, key);
  if (!environment) notFound();

  return (
    <>
      <EnvironmentDetailHeader environment={environment} />
      <EnvironmentTabs environmentKey={environment.key} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.5fr)]">
        <div className="space-y-4">
          <EnvironmentSettingsCard
            projectKey={project.key}
            environment={environment}
          />
          <EnvironmentDangerCard />
        </div>

        <div className="space-y-4">
          <EnvironmentMetadataCard environment={environment} />
          <ProtectedEnvironmentsNote />
        </div>
      </div>
    </>
  );
}
