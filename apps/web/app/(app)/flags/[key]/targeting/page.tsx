import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlagDetailHeader } from "@/components/app/flags/flag-headers";
import { FlagTabs } from "@/components/app/flags/flag-tabs";
import { FlagTargeting } from "@/components/app/flags/flag-targeting";
import { getDashboardData, getFlagSummary } from "@/lib/dashboard-data";
import { getFlagDetail } from "@/lib/flag-detail-data";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/flags/[key]/targeting">,
): Promise<Metadata> {
  const { key } = await props.params;
  const summary = getFlagSummary(key);

  return {
    title: summary ? `${summary.key} · Targeting` : "Flag not found",
    description: `Targeting rules for ${key}.`,
  };
}

export default async function FlagTargetingPage(
  props: PageProps<"/flags/[key]/targeting">,
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
      <FlagTargeting flag={flag} />
    </>
  );
}
