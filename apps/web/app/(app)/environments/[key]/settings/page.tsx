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
import { getEnvironment } from "@/lib/environment-data";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/environments/[key]/settings">,
): Promise<Metadata> {
  const { key } = await props.params;
  const environment = getEnvironment(key, new Date());

  return {
    title: environment ? `${environment.name} · Settings` : "Not found",
    description: environment
      ? `Settings for ${environment.name}.`
      : undefined,
  };
}

export default async function EnvironmentSettingsPage(
  props: PageProps<"/environments/[key]/settings">,
) {
  const { key } = await props.params;
  const now = new Date();

  const environment = getEnvironment(key, now);
  if (!environment) notFound();

  return (
    <>
      <EnvironmentDetailHeader environment={environment} />
      <EnvironmentTabs environmentKey={environment.key} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.5fr)]">
        <div className="space-y-4">
          <EnvironmentSettingsCard environment={environment} />
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
