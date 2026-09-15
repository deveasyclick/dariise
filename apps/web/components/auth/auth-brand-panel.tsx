import Link from "next/link";
import { CheckIcon, GlobeIcon, MoonIcon } from "lucide-react";
import { Logo } from "@/components/logo";

const highlights = [
  "Progressive rollouts and instant kill switches",
  "Audit-ready history for every flag change",
  "SDKs for many languages and runtimes",
] as const;

/**
 * The branding panel shown alongside every authentication form.
 *
 * Hidden below `lg` so that small screens show only the form. Colours come from
 * the auth token group, so the panel follows the theme rather than hard-coding
 * a single light appearance.
 */
export function AuthBrandPanel() {
  return (
    <aside className="bg-auth-panel border-auth-panel-border hidden flex-col justify-between border-r p-10 lg:flex">
      <div>
        <div className="flex items-center gap-2">
          <span className="bg-auth-glyph-bg text-auth-accent flex size-8 items-center justify-center rounded-lg">
            <Logo className="size-4" />
          </span>
          <span className="text-auth-heading text-sm font-semibold tracking-tight">
            Dariise
          </span>
        </div>

        <nav aria-label="Account and workspace" className="mt-5 flex gap-2">
          <Link
            href="/"
            aria-current="page"
            className="bg-auth-badge border-auth-badge-border text-auth-heading rounded-full border px-3 py-1 text-xs font-medium"
          >
            Access
          </Link>
          <Link
            href="/create-workspace"
            className="border-auth-badge-border text-auth-muted hover:text-auth-heading rounded-full border border-dashed px-3 py-1 text-xs font-medium transition-colors"
          >
            Workspace
          </Link>
        </nav>

        <div className="mt-16">
          <p className="text-auth-accent font-mono text-[11px] font-medium tracking-[0.18em] uppercase">
            Feature management
          </p>
          <p className="text-auth-heading mt-3 max-w-xs text-3xl leading-tight font-semibold tracking-tight">
            Ship features with confidence.
          </p>
          <p className="text-auth-body mt-4 max-w-sm text-sm leading-6">
            Give your team fine-grained control over every release — no
            redeploys, no guesswork.
          </p>
          <ul className="mt-8 space-y-3">
            {highlights.map((highlight) => (
              <li
                key={highlight}
                className="text-auth-body flex items-start gap-2.5 text-sm leading-6"
              >
                <CheckIcon
                  aria-hidden="true"
                  className="text-auth-accent mt-1 size-3.5 shrink-0"
                />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="text-auth-muted flex items-center justify-between text-xs">
        <p>&copy; 2026 Dariise, Inc.</p>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <GlobeIcon aria-hidden="true" className="size-3.5" />
            EN
          </span>
          <MoonIcon aria-hidden="true" className="size-3.5" />
        </div>
      </div>
    </aside>
  );
}
