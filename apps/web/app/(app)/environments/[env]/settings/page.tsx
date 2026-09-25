import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  EnvironmentMetadataCard,
  ProtectedEnvironmentsNote,
} from "@/components/app/environments/environment-cards";
import { EnvironmentArchive } from "@/components/app/environments/environment-archive";
import { EnvironmentDetailsForm } from "@/components/app/environments/environment-details-form";
import { EnvironmentDetailHeader } from "@/components/app/environments/environment-headers";
import { EnvironmentSettingsCard } from "@/components/app/environments/environment-settings";
import { EnvironmentTabs } from "@/components/app/environments/environment-tabs";
import { getScope } from "@/lib/scope";
import { findEnvironment } from "../load-environment";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/environments/[env]/settings">,
): Promise<Metadata> {
  const { env } = await props.params;
  const { project } = await getScope();

  if (!project) return { title: "Environment" };

  const environment = await findEnvironment(project.key, env);

  return environment
    ? {
        title: `${environment.name} · Settings`,
        description: `Settings for ${environment.name}.`,
      }
    : { title: "Not found" };
}

export default async function EnvironmentSettingsPage(
  props: PageProps<"/environments/[env]/settings">,
) {
  const { env } = await props.params;
  const { project } = await getScope();

  if (!project) notFound();

  const environment = await findEnvironment(project.key, env);
  if (!environment) notFound();

  const archived = environment.archivedAt !== null;

  return (
    <>
      <EnvironmentDetailHeader environment={environment} />
      <EnvironmentTabs environmentKey={environment.key} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.5fr)]">
        <div className="space-y-4">
          {archived ? null : (
            <EnvironmentDetailsForm
              projectKey={project.key}
              environmentKey={environment.key}
              name={environment.name}
              description={environment.description}
            />
          )}
          <EnvironmentSettingsCard
            projectKey={project.key}
            environment={environment}
            disabled={archived}
          />
          <EnvironmentArchive
            projectKey={project.key}
            environmentKey={environment.key}
            environmentName={environment.name}
            archived={archived}
          />
        </div>

        <div className="space-y-4">
          <EnvironmentMetadataCard environment={environment} />
          <ProtectedEnvironmentsNote />
        </div>
      </div>
    </>
  );
}
