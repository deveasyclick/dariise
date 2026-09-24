import type { Metadata } from "next";
import { SettingsBilling } from "@/components/app/settings/settings-billing";
import { settingsDescription } from "@/components/app/settings/settings-options";
import { getBillingSummary } from "@/lib/billing-data";
import { getScope } from "@/lib/scope";

export const metadata: Metadata = {
  title: "Billing",
  description: settingsDescription,
};

export const dynamic = "force-dynamic";

export default async function SettingsBillingPage() {
  // One `now` for the whole render, so the derived billing dates agree.
  const { environments } = await getScope();
  const summary = getBillingSummary(new Date(), environments.length);

  return <SettingsBilling summary={summary} />;
}
