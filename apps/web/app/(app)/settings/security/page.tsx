import type { Metadata } from "next";
import { SettingsSecurity } from "@/components/app/settings/settings-security";
import { getSecuritySettings, settingsDescription } from "@/lib/settings-data";

export const metadata: Metadata = {
  title: "Security",
  description: settingsDescription,
};

export const dynamic = "force-dynamic";

export default function SettingsSecurityPage() {
  return <SettingsSecurity settings={getSecuritySettings()} />;
}
