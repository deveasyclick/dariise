import type { Metadata } from "next";
import { FlagDependencies } from "@/components/app/flags/flag-dependencies";
import { FlagDetailHeader } from "@/components/app/flags/flag-headers";
import { FlagPromotion } from "@/components/app/flags/flag-promotion";
import { FlagTabs } from "@/components/app/flags/flag-tabs";
import {
  listPromotionTargets,
  loadFlagDetail,
  requireFlagScope,
} from "@/components/app/flags/flag-queries";
import { flags as flagsApi } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/environments/[env]/flags/[key]/dependencies">,
): Promise<Metadata> {
  const { env, key } = await props.params;
  const { projectKey, environmentKey } = await requireFlagScope(env);
  const flag = await loadFlagDetail(projectKey, environmentKey, key);

  return {
    title: `${flag.key} · Dependencies`,
    description: `Dependencies for ${key}.`,
  };
}

export default async function FlagDependenciesPage(
  props: PageProps<"/environments/[env]/flags/[key]/dependencies">,
) {
  const { env, key } = await props.params;

  const { projectKey, environmentKey } = await requireFlagScope(env);
  const flag = await loadFlagDetail(projectKey, environmentKey, key);
  const [graph, promotionTargets] = await Promise.all([
    flagsApi.dependencies(projectKey, flag.key, environmentKey),
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
      <FlagDependencies
        graph={graph}
        flagKey={flag.key}
        environmentName={flag.environmentName}
        enabled={flag.enabled}
      />
    </>
  );
}
