import { AuthShell } from "@/components/auth/auth-shell";

/**
 * Shell for the last onboarding step, which welcomes the user instead of
 * pitching the product — see `AuthBrandPanel`'s `getting-started` variant.
 *
 * The create-project route lives outside `(auth)` because the two groups share
 * the same column geometry but not the same panel copy; the geometry itself is
 * owned once by `AuthShell`.
 */
export default function GettingStartedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthShell variant="getting-started">{children}</AuthShell>;
}
