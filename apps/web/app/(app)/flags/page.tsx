import { redirect } from "next/navigation";
import { getScope } from "@/lib/scope";

export const dynamic = "force-dynamic";

/**
 * Flags belong to a project and are listed per project, so the bare list has no
 * screen of its own: it sends the reader to the list of the environment the
 * dashboard is scoped to, which is the same project list narrowed to one
 * environment.
 */
export default async function FeatureFlagsRedirectPage() {
  const { project, environment } = await getScope();

  if (!project || !environment) redirect("/environments");

  redirect(`/environments/${environment.key}/flags`);
}
