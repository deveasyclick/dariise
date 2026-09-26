import { redirect } from "next/navigation";
import { requireFlagScope } from "@/components/app/flags/flag-queries";

export const dynamic = "force-dynamic";

/**
 * The dependencies tab, at its former environment-scoped address. Dependencies
 * are project-wide now, so the redirect only keeps the URL alive.
 */
export default async function LegacyFlagDependenciesPage(
  props: PageProps<"/environments/[env]/flags/[key]/dependencies">,
) {
  const { env, key } = await props.params;
  const { projectKey, environmentKey } = await requireFlagScope(env);

  redirect(
    `/projects/${projectKey}/flags/${key}?environment=${environmentKey}&tab=dependencies`,
  );
}
