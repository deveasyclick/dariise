import {
  FlaskConicalIcon,
  FolderIcon,
  SmartphoneIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react";
import type { EnvironmentColor } from "@/lib/environment-color";

/**
 * Icon a project is drawn with, keyed by the colour the API stores.
 *
 * The API carries no glyph, so the project's colour picks one; the tile's tint
 * comes from the same colour, which keeps the glyph and the colour chosen on the
 * create screen consistent. Index it with a resolved colour — see
 * `resolveEnvironmentColor`.
 */
export const projectGlyphs: Record<EnvironmentColor, LucideIcon> = {
  primary: FolderIcon,
  cyan: FlaskConicalIcon,
  purple: SmartphoneIcon,
  green: WrenchIcon,
  indigo: SmartphoneIcon,
  slate: WrenchIcon,
};
