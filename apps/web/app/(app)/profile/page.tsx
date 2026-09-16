import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { PasswordForm } from "@/components/app/profile/password-form";
import { ProfileAccountCard } from "@/components/app/profile/profile-account-card";
import { ProfileForm } from "@/components/app/profile/profile-form";
import {
  ProfileNotifications,
  ProfilePreferences,
} from "@/components/app/profile/profile-preferences";
import { getEnvironmentOptions } from "@/lib/environment-data";
import { getProfile } from "@/lib/profile-data";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your personal account and preferences.",
};

export const dynamic = "force-dynamic";

export default function ProfilePage() {
  const profile = getProfile();

  return (
    <>
      <PageHeader
        title="Profile"
        description="Manage your personal account and preferences."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.62fr)]">
        <div className="space-y-4">
          <ProfileForm profile={profile} />
          <PasswordForm />
        </div>

        <div className="space-y-4">
          <ProfileAccountCard profile={profile} />
          <ProfilePreferences
            preferences={profile.preferences}
            environments={getEnvironmentOptions()}
          />
          <ProfileNotifications notifications={profile.notifications} />
        </div>
      </div>
    </>
  );
}
