import type { Metadata } from "next";
import { SettingsAppearance } from "@/components/app/settings/settings-appearance";
import { SettingsDanger } from "@/components/app/settings/settings-danger";
import { SettingsProfileForm } from "@/components/app/settings/settings-profile-form";
import { getEnvironmentOptions } from "@/lib/environment-data";
import {
  getWorkspaceProfile,
  getWorkspaceUrl,
  settingsDescription,
} from "@/lib/settings-data";

export const metadata: Metadata = {
  title: "Settings",
  description: settingsDescription,
};

export const dynamic = "force-dynamic";

export default function SettingsGeneralPage() {
  const profile = getWorkspaceProfile();

  return (
    <div className="space-y-3">
      <SettingsProfileForm
        profile={profile}
        environments={getEnvironmentOptions()}
        workspaceUrl={getWorkspaceUrl()}
      />
      <SettingsAppearance theme={profile.theme} />
      <SettingsDanger />
    </div>
  );
}
