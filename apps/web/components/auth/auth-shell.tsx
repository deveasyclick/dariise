import type { ReactNode } from "react";
import {
  AuthBrandPanel,
  type AuthPanelVariant,
} from "@/components/auth/auth-brand-panel";

interface AuthShellProps {
  /** Copy the brand panel shows; see `AuthBrandPanel`. */
  variant?: AuthPanelVariant;
  children: ReactNode;
}

/**
 * Two-column shell shared by the access and onboarding screens: the brand panel
 * beside the form.
 *
 * The route groups own the layouts so each group can pick the panel copy it
 * shows, while the column geometry and the form column live here once.
 */
export function AuthShell({ variant, children }: AuthShellProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <AuthBrandPanel variant={variant} />
      <main className="flex items-center justify-center px-6 py-12 sm:px-10">
        {children}
      </main>
    </div>
  );
}
