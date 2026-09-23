import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Set a new password for your Dariise account.",
};

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const params = await searchParams;

  const rawToken = params.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

  const rawError = params.error;
  const error = Array.isArray(rawError) ? rawError[0] : rawError;

  // A consumed and an expired link are reported the same way, so both land here.
  const expired = error === "INVALID_TOKEN";

  if (!token || expired) {
    return (
      <AuthCard
        title={expired ? "That link has expired" : "Reset link required"}
        description={
          expired
            ? "Password reset links are single-use and expire after 30 minutes. Request a new one to continue."
            : "This page needs the link from your reset email. Request one and open it from your inbox."
        }
        backLink={<BackToSignIn />}
      >
        <Button asChild className="w-full">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </AuthCard>
    );
  }

  return <ResetPasswordForm token={token} />;
}

function BackToSignIn() {
  return (
    <Link
      href="/"
      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
    >
      <ArrowLeftIcon aria-hidden="true" className="size-4" />
      Back to sign in
    </Link>
  );
}
