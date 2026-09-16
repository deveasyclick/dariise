import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  EnvironmentDangerCard,
  EnvironmentHealthCard,
} from "@/components/app/environments/environment-cards";
import { EnvironmentDetailHeader } from "@/components/app/environments/environment-headers";
import {
  EndpointsCard,
  SdkKeysCard,
} from "@/components/app/environments/environment-keys";
import { EnvironmentSettingsCard } from "@/components/app/environments/environment-settings";
import { EnvironmentTabs } from "@/components/app/environments/environment-tabs";
import { getEnvironment } from "@/lib/environment-data";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/environments/[key]">,
): Promise<Metadata> {
  const { key } = await props.params;
  const environment = getEnvironment(key, new Date());

  return {
    title: environment ? `${environment.name} · Environments` : "Not found",
    description: environment
      ? `SDK keys, endpoints, and settings for ${environment.name}.`
      : undefined,
  };
}

/** SDK keys tab — the default view for an environment. */
export default async function EnvironmentKeysPage(
  props: PageProps<"/environments/[key]">,
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
          <SdkKeysCard keys={environment.sdkKeys} />
          <EndpointsCard endpoints={environment.endpoints} />
        </div>

        <div className="space-y-4">
          <EnvironmentHealthCard environment={environment} />
          <EnvironmentSettingsCard environment={environment} />
          <EnvironmentDangerCard />
        </div>
      </div>
    </>
  );
}
