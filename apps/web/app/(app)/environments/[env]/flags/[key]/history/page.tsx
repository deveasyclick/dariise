import type { Metadata } from "next";
import { FlagDetailHeader } from "@/components/app/flags/flag-headers";
import { FlagHistory } from "@/components/app/flags/flag-history";
import { FlagPromotion } from "@/components/app/flags/flag-promotion";
import { FlagTabs } from "@/components/app/flags/flag-tabs";
import {
  listFlagVersions,
  listPromotionTargets,
  loadFlagDetail,
  requireFlagScope,
} from "@/components/app/flags/flag-queries";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/environments/[env]/flags/[key]/history">,
): Promise<Metadata> {
  const { env, key } = await props.params;
  const { projectKey, environmentKey } = await requireFlagScope(env);
  const flag = await loadFlagDetail(projectKey, environmentKey, key);

  return {
    title: `${flag.key} · History`,
    description: `Version history for ${key}.`,
  };
}

export default async function FlagHistoryPage(
  props: PageProps<"/environments/[env]/flags/[key]/history">,
) {
  const { env, key } = await props.params;
  const now = new Date();

  const { projectKey, environmentKey } = await requireFlagScope(env);
  const flag = await loadFlagDetail(projectKey, environmentKey, key);
  const [versions, promotionTargets] = await Promise.all([
    listFlagVersions(projectKey, flag.key, environmentKey),
    listPromotionTargets(projectKey, environmentKey),
  ]);

  return (
    <>
      <FlagDetailHeader
        flagKey={flag.key}
        name={flag.name}
        description={flag.description ?? ""}
        environmentKey={environmentKey}
        environmentLabel={flag.environmentName}
        enabled={flag.enabled}
        promotion={
          <FlagPromotion
            projectKey={projectKey}
            environmentKey={environmentKey}
            flagKey={flag.key}
            environmentName={flag.environmentName}
            targets={promotionTargets}
          />
        }
      />
      <FlagTabs environmentKey={environmentKey} flagKey={flag.key} />
      <FlagHistory
        flagKey={flag.key}
        versions={versions}
        environmentName={flag.environmentName}
        variationCount={flag.variations.length}
        rolloutPercentage={flag.rolloutPercentage}
        now={now}
      />
    </>
  );
}
