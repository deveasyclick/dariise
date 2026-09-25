import type { Metadata } from "next";
import {
  DangerZoneCard,
  FlagArchiveAction,
  FlagFallback,
  FlagMetadata,
} from "@/components/app/flags/flag-config-panels";
import { FlagApprovalPanel } from "@/components/app/flags/flag-approval";
import { FlagConfiguration } from "@/components/app/flags/flag-configuration";
import { FlagDetailHeader } from "@/components/app/flags/flag-headers";
import { FlagPromotion } from "@/components/app/flags/flag-promotion";
import { FlagTabs } from "@/components/app/flags/flag-tabs";
import {
  listPromotionTargets,
  loadFlagDetail,
  loadPendingChangeRequest,
  requireFlagScope,
} from "@/components/app/flags/flag-queries";
import { formatRelativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/environments/[env]/flags/[key]">,
): Promise<Metadata> {
  const { env, key } = await props.params;
  const { projectKey, environmentKey } = await requireFlagScope(env);
  const flag = await loadFlagDetail(projectKey, environmentKey, key);

  return {
    title: `${flag.key} · Feature Flags`,
    description: flag.description ?? undefined,
  };
}

/** Configuration tab — the default view for a flag. */
export default async function FlagConfigurationPage(
  props: PageProps<"/environments/[env]/flags/[key]">,
) {
  const { env, key } = await props.params;
  const now = new Date();

  const { projectKey, environmentKey, protectedEnvironment } =
    await requireFlagScope(env);
  const flag = await loadFlagDetail(projectKey, environmentKey, key);
  const pendingApproval = await loadPendingChangeRequest(
    projectKey,
    flag.key,
    environmentKey,
  );
  const promotionTargets = await listPromotionTargets(
    projectKey,
    environmentKey,
  );

  const offVariation = flag.variations.find(
    (variation) => variation.key === flag.offVariation,
  );
  const fallback = offVariation ? String(offVariation.value) : flag.offVariation;

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

      <FlagConfiguration
        projectKey={projectKey}
        flagKey={flag.key}
        type={flag.type}
        flag={flag}
        updatedLabel={formatRelativeTime(flag.updatedAt, now)}
        metadata={
          <>
            <FlagMetadata flag={flag} now={now} />
            <FlagFallback flagKey={flag.key} fallback={fallback} />
          </>
        }
        dangerZone={
          <DangerZoneCard>
            <FlagArchiveAction />
          </DangerZoneCard>
        }
        protectedEnvironment={protectedEnvironment}
        approval={
          <FlagApprovalPanel
            projectKey={projectKey}
            flagKey={flag.key}
            request={pendingApproval}
            protectedEnvironment={protectedEnvironment}
          />
        }
      />
    </>
  );
}
