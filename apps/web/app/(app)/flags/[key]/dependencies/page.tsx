import type { Metadata } from "next";
import { FlagDependencies } from "@/components/app/flags/flag-dependencies";
import { FlagDetailHeader } from "@/components/app/flags/flag-headers";
import { FlagTabs } from "@/components/app/flags/flag-tabs";
import {
  environmentConfig,
  loadFlagDetail,
  requireFlagScope,
} from "@/components/app/flags/flag-queries";
import { flags as flagsApi } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/flags/[key]/dependencies">,
): Promise<Metadata> {
  const { key } = await props.params;
  const { projectKey } = await requireFlagScope();
  const flag = await loadFlagDetail(projectKey, key);

  return {
    title: `${flag.key} · Dependencies`,
    description: `Dependencies for ${key}.`,
  };
}

export default async function FlagDependenciesPage(
  props: PageProps<"/flags/[key]/dependencies">,
) {
  const { key } = await props.params;

  const { projectKey, environmentKey } = await requireFlagScope();
  const flag = await loadFlagDetail(projectKey, key);
  const config = environmentConfig(flag, environmentKey);
  const graph = await flagsApi.dependencies(projectKey, flag.key);

  return (
    <>
      <FlagDetailHeader
        flagKey={flag.key}
        name={flag.name}
        description={flag.description ?? ""}
        environmentLabel={config.environmentName}
        enabled={config.enabled}
      />
      <FlagTabs flagKey={flag.key} />
      <FlagDependencies
        graph={graph}
        flagKey={flag.key}
        environmentName={config.environmentName}
        enabled={config.enabled}
      />
    </>
  );
}
