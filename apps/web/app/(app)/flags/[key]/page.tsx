import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
import { getDashboardData, getFlagSummary } from "@/lib/dashboard-data";
import { getFlagDetail } from "@/lib/flag-detail-data";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/flags/[key]">,
): Promise<Metadata> {
  const { key } = await props.params;
  const summary = getFlagSummary(key);

  return {
    title: summary ? `${summary.key} · Feature Flags` : "Flag not found",
    description: summary?.description,
  };
}

/** Configuration tab — the default view for a flag. */
export default async function FlagConfigurationPage(
  props: PageProps<"/flags/[key]">,
) {
  const { key } = await props.params;
  const now = new Date();

  const summary = getFlagSummary(key);
  if (!summary) notFound();

  const flag = getFlagDetail(key, now, summary);
  if (!flag) notFound();

  const { environmentLabel } = getDashboardData(now);

  return (
    <>
      <FlagDetailHeader
        flagKey={flag.key}
        name={flag.name}
        description={flag.description}
        environmentLabel={environmentLabel}
        enabled={flag.enabled}
      />
      <FlagTabs flagKey={flag.key} />

      <FlagConfiguration
        flag={flag}
        metadata={
          <>
            <FlagMetadata flag={flag} />
            <FlagFallback flag={flag} />
          </>
        }
        variations={<FlagVariations flag={flag} />}
        dangerZone={
          <DangerZoneCard>
            <FlagArchiveAction />
          </DangerZoneCard>
        }
      />
    </>
  );
}
