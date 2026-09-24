import type { Metadata } from "next";
import { FlagDetailHeader } from "@/components/app/flags/flag-headers";
import { FlagTabs } from "@/components/app/flags/flag-tabs";
import { FlagTargeting } from "@/components/app/flags/flag-targeting";
import {
  environmentConfig,
  loadFlagDetail,
  requireFlagScope,
} from "@/components/app/flags/flag-queries";
import { flags as flagsApi } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/flags/[key]/targeting">,
): Promise<Metadata> {
  const { key } = await props.params;
  const { projectKey } = await requireFlagScope();
  const flag = await loadFlagDetail(projectKey, key);

  return {
    title: `${flag.key} · Targeting`,
    description: `Targeting rules for ${key}.`,
  };
}

export default async function FlagTargetingPage(
  props: PageProps<"/flags/[key]/targeting">,
) {
  const { key } = await props.params;
  const now = new Date();

  const { projectKey, environmentKey } = await requireFlagScope();
  const flag = await loadFlagDetail(projectKey, key);
  const config = environmentConfig(flag, environmentKey);

  const [rules, targets] = await Promise.all([
    flagsApi.rules(projectKey, flag.key, config.environmentKey),
    flagsApi.targets(projectKey, flag.key, config.environmentKey),
  ]);

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
      <FlagTargeting
        projectKey={projectKey}
        flagKey={flag.key}
        config={config}
        rules={rules}
        targets={targets}
        updatedLabel={formatRelativeTime(flag.updatedAt, now)}
      />
    </>
  );
}
