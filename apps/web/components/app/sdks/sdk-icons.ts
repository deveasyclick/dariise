import {
  AtomIcon,
  BoxIcon,
  CodeIcon,
  CoffeeIcon,
  DotIcon,
  FileCodeIcon,
  GemIcon,
  HexagonIcon,
  type LucideIcon,
} from "lucide-react";
import type { SdkKey } from "@/lib/sdk-data";

/**
 * Glyph each SDK is drawn with.
 *
 * Deliberately generic lucide icons rather than brand marks: the icon library
 * this project uses ships no brand logos, and inventing a bespoke SVG for each
 * vendor would not survive the next SDK being added.
 */
export const sdkIcons: Record<SdkKey, LucideIcon> = {
  node: HexagonIcon,
  python: FileCodeIcon,
  go: BoxIcon,
  react: AtomIcon,
  java: CoffeeIcon,
  ruby: GemIcon,
  php: CodeIcon,
  dotnet: DotIcon,
};
