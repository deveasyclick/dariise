import type { Metadata } from "next";
import { FlagDetailHeader } from "@/components/app/flags/flag-headers";
import { FlagPromotion } from "@/components/app/flags/flag-promotion";
import { FlagTabs } from "@/components/app/flags/flag-tabs";
import { FlagApprovalPanel } from "@/components/app/flags/flag-approval";
import { FlagTargeting } from "@/components/app/flags/flag-targeting";
import {
  listPromotionTargets,
  loadFlagDetail,
  loadPendingChangeRequest,
  requireFlagScope,
} from "@/components/app/flags/flag-queries";
import { flags as flagsApi } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/environments/[env]/flags/[key]/targeting">,
): Promise<Metadata> {
  const { env, key } = await props.params;
  const { projectKey, environmentKey } = await requireFlagScope(env);
  const flag = await loadFlagDetail(projectKey, environmentKey, key);

  return {
    title: `${flag.key} · Targeting`,
    description: `Targeting rules for ${key}.`,
  };
}

export default async function FlagTargetingPage(
  props: PageProps<"/environments/[env]/flags/[key]/targeting">,
) {
  const { env, key } = await props.params;
  const now = new Date();

  const { projectKey, environmentKey, protectedEnvironment } =
    await requireFlagScope(env);
  const flag = await loadFlagDetail(projectKey, environmentKey, key);
  const promotionTargets = await listPromotionTargets(
    projectKey,
    environmentKey,
  );

  const [rules, targets, pendingApproval] = await Promise.all([
    flagsApi.rules(projectKey, flag.key, environmentKey),
    flagsApi.targets(projectKey, flag.key, environmentKey),
    loadPendingChangeRequest(projectKey, flag.key, environmentKey),
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
      <FlagTargeting
        projectKey={projectKey}
        flagKey={flag.key}
        flag={flag}
        rules={rules}
        targets={targets}
        updatedLabel={formatRelativeTime(flag.updatedAt, now)}
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
