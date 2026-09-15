import { CopyIcon } from "lucide-react";
import { cn } from "cn";

interface SdkPreviewProps {
  /** Code lines, rendered one per row so indentation is preserved. */
  lines: string[];
  /** Optional label for the code block header, e.g. a language. */
  language?: string;
  title?: string;
  className?: string;
}

/**
 * Read-only SDK snippet.
 *
 * Copy is presentational for now — the clipboard API needs a client boundary
 * and the snippet is not sourced from a live config yet.
 */
export function SdkPreview({
  lines,
  language = "TypeScript",
  title = "SDK preview",
  className,
}: SdkPreviewProps) {
  return (
    <div className={cn("bg-card overflow-hidden rounded-lg border", className)}>
      <header className="flex items-center justify-between gap-3 border-b px-3 py-2">
        <h2 className="text-[12px] font-medium">{title}</h2>
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[10px]">
          {language}
          <CopyIcon aria-hidden="true" className="size-3" />
        </span>
      </header>

      <pre className="overflow-x-auto p-3 text-[11px] leading-5">
        <code className="font-mono">
          {lines.map((line, index) => (
            <span key={index} className="block">
              {line.length > 0 ? line : "\u00A0"}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

/**
 * Build the evaluation snippet for a flag.
 *
 * Shared by the create screen and the Configuration tab so the shape of the
 * snippet lives in exactly one place.
 */
export function sdkSnippet(options: {
  flagKey: string;
  fallback: string;
  environment?: string;
}): string[] {
  const { flagKey, fallback, environment } = options;

  return [
    'import { Dariise } from "@dariise/sdk";',
    "",
    "const client = new Dariise({",
    '  apiKey: process.env.DARIISE_API_KEY,',
    ...(environment ? [`  environment: "${environment}",`] : []),
    "});",
    "",
    `const enabled = await client.variation("${flagKey}", {`,
    '  userId: "user_123",',
    `}, "${fallback}");`,
    "",
    `// ${flagKey} is ${fallback === "true" ? "on" : "off"} by default`,
  ];
}
