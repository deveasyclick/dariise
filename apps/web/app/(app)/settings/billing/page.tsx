import type { Metadata } from "next";
import { SettingsBilling } from "@/components/app/settings/settings-billing";
import { getBillingSummary } from "@/lib/billing-data";
import { settingsDescription } from "@/lib/settings-data";

export const metadata: Metadata = {
  title: "Billing",
  description: settingsDescription,
};

export const dynamic = "force-dynamic";

export default function SettingsBillingPage() {
  // One `now` for the whole render, so the derived billing dates agree.
  const summary = getBillingSummary(new Date());

  return <SettingsBilling summary={summary} />;
}
