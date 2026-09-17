import {
  FlaskConicalIcon,
  FolderIcon,
  SmartphoneIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react";
import type { ProjectGlyph } from "@/lib/project-data";

/**
 * Icon each project glyph is drawn with.
 *
 * The tile's tint comes from the project's own colour — see
 * `environmentColorTone` — so the glyph and the colour chosen on the create
 * screen stay independent.
 */
export const projectGlyphs: Record<ProjectGlyph, LucideIcon> = {
  folder: FolderIcon,
  flask: FlaskConicalIcon,
  phone: SmartphoneIcon,
  wrench: WrenchIcon,
};
