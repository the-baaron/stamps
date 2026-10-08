import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";

// The styles in Font Awesome Free. Pro styles (light, thin, duotone, sharp)
// need a paid licence, so they are not bundled.
export const iconStyles = {
  solid: { label: "Solid", pack: fas },
  regular: { label: "Regular", pack: far },
  brands: { label: "Brands", pack: fab },
};
export type IconStyle = keyof typeof iconStyles;
export const iconPositions = ["before", "after"] as const;
export type IconPosition = typeof iconPositions[number];

export interface IconEntry {
  name: string;
  aliases: string[];
  width: number;
  height: number;
  path: string;
}

const toEntry = (def: any): IconEntry => {
  const [width, height, aliases, , path] = def.icon;
  return {
    name: def.iconName,
    aliases: aliases.filter((a: unknown) => typeof a === "string"),
    width,
    height,
    // Duotone-shaped definitions carry two paths; Free icons carry one.
    path: Array.isArray(path) ? path.join(" ") : path,
  };
};

const lists = {} as Record<IconStyle, IconEntry[]>;
const lookups = {} as Record<IconStyle, Map<string, IconEntry>>;

for (const style of Object.keys(iconStyles) as IconStyle[]) {
  const seen = new Set<string>();
  const list: IconEntry[] = [];
  const lookup = new Map<string, IconEntry>();
  for (const def of Object.values(iconStyles[style].pack) as any[]) {
    if (!def?.iconName || seen.has(def.iconName)) continue;
    seen.add(def.iconName);
    const entry = toEntry(def);
    list.push(entry);
    lookup.set(entry.name, entry);
    entry.aliases.forEach((a) => lookup.has(a) || lookup.set(a, entry));
  }
  lists[style] = list.sort((a, b) => a.name.localeCompare(b.name));
  lookups[style] = lookup;
}

export const iconList = (style: IconStyle) => lists[style];

// Accepts "heart", "fa-heart" or "faHeart". Falls back to any other style
// that has the icon, so a URL never breaks over a style mismatch.
export const findIcon = (name?: unknown, style?: unknown) => {
  if (typeof name !== "string" || !name) return undefined;
  const key = name
    .replace(/^fa-/, "")
    .replace(/^fa(?=[A-Z0-9])/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
  const order = Object.keys(iconStyles) as IconStyle[];
  const preferred = order.includes(style as IconStyle)
    ? (style as IconStyle)
    : "solid";
  for (const s of [preferred, ...order.filter((o) => o !== preferred)]) {
    const entry = lookups[s].get(key);
    if (entry) return entry;
  }
  return undefined;
};
