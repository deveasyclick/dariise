import type { Metadata } from "next";
import { FlagDetailHeader } from "@/components/app/flags/flag-headers";
import { FlagHistory } from "@/components/app/flags/flag-history";
import { FlagTabs } from "@/components/app/flags/flag-tabs";
import {
  environmentConfig,
  listFlagVersions,
  loadFlagDetail,
  requireFlagScope,
} from "@/components/app/flags/flag-queries";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/flags/[key]/history">,
): Promise<Metadata> {
  const { key } = await props.params;
  const { projectKey } = await requireFlagScope();
  const flag = await loadFlagDetail(projectKey, key);

  return {
    title: `${flag.key} · History`,
    description: `Version history for ${key}.`,
  };
}

export default async function FlagHistoryPage(
  props: PageProps<"/flags/[key]/history">,
) {
  const { key } = await props.params;
  const now = new Date();

  const { projectKey, environmentKey } = await requireFlagScope();
  const flag = await loadFlagDetail(projectKey, key);
  const config = environmentConfig(flag, environmentKey);
  const versions = await listFlagVersions(projectKey, flag.key);

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
      <FlagHistory
        flagKey={flag.key}
        versions={versions}
        environmentName={config.environmentName}
        variationCount={config.variations.length}
        rolloutPercentage={config.rolloutPercentage}
        now={now}
      />
    </>
  );
}
