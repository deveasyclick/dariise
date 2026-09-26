import { redirect } from "next/navigation";
import { requireFlagScope } from "@/components/app/flags/flag-queries";

export const dynamic = "force-dynamic";

/**
 * The flag page used to live inside one environment's URL. A flag is
 * project-scoped now, so this keeps the old address working by sending the
 * reader to the canonical page with that environment selected.
 */
export default async function LegacyFlagPage(
  props: PageProps<"/environments/[env]/flags/[key]">,
) {
  const { env, key } = await props.params;
  const { projectKey, environmentKey } = await requireFlagScope(env);

  redirect(
    `/projects/${projectKey}/flags/${key}?environment=${environmentKey}`,
  );
}
