import type { Metadata } from "next";
import {
  DangerZoneCard,
  FlagArchiveAction,
  FlagFallback,
  FlagMetadata,
  FlagVariations,
} from "@/components/app/flags/flag-config-panels";
import { FlagConfiguration } from "@/components/app/flags/flag-configuration";
import { FlagDetailHeader } from "@/components/app/flags/flag-headers";
import { FlagTabs } from "@/components/app/flags/flag-tabs";
import {
  environmentConfig,
  loadFlagDetail,
  requireFlagScope,
} from "@/components/app/flags/flag-queries";
import { formatRelativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/flags/[key]">,
): Promise<Metadata> {
  const { key } = await props.params;
  const { projectKey } = await requireFlagScope();
  const flag = await loadFlagDetail(projectKey, key);

  return {
    title: `${flag.key} · Feature Flags`,
    description: flag.description ?? undefined,
  };
}

/** Configuration tab — the default view for a flag. */
export default async function FlagConfigurationPage(
  props: PageProps<"/flags/[key]">,
) {
  const { key } = await props.params;
  const now = new Date();

  const { projectKey, environmentKey } = await requireFlagScope();
  const flag = await loadFlagDetail(projectKey, key);
  const config = environmentConfig(flag, environmentKey);

  const offVariation = config.variations.find(
    (variation) => variation.key === config.offVariation,
  );
  const fallback = offVariation
    ? String(offVariation.value)
    : config.offVariation;

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

      <FlagConfiguration
        projectKey={projectKey}
        flagKey={flag.key}
        config={config}
        updatedLabel={formatRelativeTime(flag.updatedAt, now)}
        metadata={
          <>
            <FlagMetadata flag={flag} now={now} />
            <FlagFallback flagKey={flag.key} fallback={fallback} />
          </>
        }
        variations={<FlagVariations variations={config.variations} />}
        dangerZone={
          <DangerZoneCard>
            <FlagArchiveAction />
          </DangerZoneCard>
        }
      />
    </>
  );
}
