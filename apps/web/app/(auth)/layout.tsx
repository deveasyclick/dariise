import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";

/**
 * Shared shell for the four authentication screens.
 *
 * This is a route group, so it adds no URL segment: `app/(auth)/page.tsx`
 * serves `/`. The root layout in `app/layout.tsx` remains the only root layout
 * and continues to own `<html>` and `<body>`.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <AuthBrandPanel />
      <main className="flex items-center justify-center px-6 py-12 sm:px-10">
        {children}
      </main>
    </div>
  );
}
