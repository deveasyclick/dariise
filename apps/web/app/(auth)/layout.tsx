import { AuthShell } from "@/components/auth/auth-shell";

/**
 * Shared shell for the four access screens — sign in, create account, reset
 * password, and create workspace — which pitch the product in the brand panel.
 *
 * This is a route group, so it adds no URL segment: `app/(auth)/page.tsx`
 * serves `/`. The root layout in `app/layout.tsx` remains the only root layout
 * and continues to own `<html>` and `<body>`.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <AuthShell>{children}</AuthShell>;
}
