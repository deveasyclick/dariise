import { redirect } from "next/navigation";
import { requireFlagScope } from "@/components/app/flags/flag-queries";

export const dynamic = "force-dynamic";

/** The targeting tab of a flag, at its former environment-scoped address. */
export default async function LegacyFlagTargetingPage(
  props: PageProps<"/environments/[env]/flags/[key]/targeting">,
) {
  const { env, key } = await props.params;
  const { projectKey, environmentKey } = await requireFlagScope(env);

  redirect(
    `/projects/${projectKey}/flags/${key}?environment=${environmentKey}&tab=targeting`,
  );
}
