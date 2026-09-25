import { redirect } from "next/navigation";
import { getScope } from "@/lib/scope";

export const dynamic = "force-dynamic";

/**
 * Flags are addressed inside an environment, so the bare list has no screen of
 * its own: it sends the reader to the environment the dashboard is scoped to.
 */
export default async function FeatureFlagsRedirectPage() {
  const { project, environment } = await getScope();

  if (!project || !environment) redirect("/environments");

  redirect(`/environments/${environment.key}/flags`);
}
