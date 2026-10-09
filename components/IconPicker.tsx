import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "../styles/Home.module.css";
import type { IconEntry, IconStyle } from "helpers/icons";

type IconsModule = typeof import("helpers/icons");
type SearchIndex = Record<string, string>;

const loadIcons = () =>
  Promise.all([
    import("helpers/icons"),
    import("helpers/iconSearch.json").then((m) => m.default as SearchIndex),
  ]);

const IconGlyph: React.FC<{ icon: IconEntry }> = ({ icon }) => (
  <svg viewBox={`0 0 ${icon.width} ${icon.height}`} aria-hidden="true">
    <path d={icon.path} fill="currentColor" />
  </svg>
);

interface IconPickerProps {
  icon: string;
  iconStyle: IconStyle;
  onChange: (icon: string, iconStyle: IconStyle) => void;
  // Open the panel on mount, and hear when it closes.
  defaultOpen?: boolean;
  onClose?: () => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  icon,
  iconStyle,
  onChange,
  defaultOpen = false,
  onClose,
}) => {
  const [icons, setIcons] = useState<IconsModule>();
  const [terms, setTerms] = useState<SearchIndex>({});
  const [open, setOpen] = useState(defaultOpen);
  const wasOpen = useRef(open);
  const [query, setQuery] = useState("");
  const [browseStyle, setBrowseStyle] = useState<IconStyle>(iconStyle);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ((open || icon) && !icons)
      loadIcons().then(([module, index]) => {
        setIcons(module);
        setTerms(index);
      });
    if (open) searchRef.current?.focus();
  }, [open, icon, icons]);

  useEffect(() => {
    if (wasOpen.current && !open) onClose?.();
    wasOpen.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !rootRef.current?.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const selected = icons?.findIcon(icon, iconStyle);

  // Name matches first, then Font Awesome's own keywords ("love" finds heart).
  const search = (style: IconStyle, text = query) => {
    if (!icons) return [];
    const list = icons.iconList(style);
    const words = text.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return list;
    const q = words.join("-");
    const tokens = (text: string) => text.split(/[\s-]+/);
    const matchAll = (text: string) => {
      const t = tokens(text);
      return words.every((w) => t.some((x) => x.startsWith(w)));
    };
    const rank = (i: IconEntry) => {
      const names = `${i.name} ${i.aliases.join(" ")}`;
      const keywords = terms[i.name] ?? "";
      if (i.name.startsWith(q)) return 0;
      if (words.every((w) => tokens(`${names} ${keywords}`).includes(w))) return 1;
      if (matchAll(names)) return 2;
      if (matchAll(`${names} ${keywords}`)) return 3;
      return -1;
    };
    return list
      .map((i) => ({ i, r: rank(i) }))
      .filter(({ r }) => r >= 0)
      .sort((a, b) => a.r - b.r)
      .map(({ i }) => i);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const results = useMemo(() => search(browseStyle), [icons, terms, query, browseStyle]);

  return (
    <div className={styles.iconPicker} ref={rootRef}>
      <button
        type="button"
        className={styles.iconPickerButton}
        onClick={() => {
          setBrowseStyle(iconStyle);
          setOpen(!open);
        }}
        aria-expanded={open}
      >
        <span className={styles.iconPickerGlyph}>
          {selected && <IconGlyph icon={selected} />}
        </span>
        <span>{icon || "No icon"}</span>
        <span className={styles.iconPickerCaret}>▾</span>
      </button>

      {open && (
        <div className={styles.iconPickerPanel}>
          <input
            ref={searchRef}
            type="search"
            placeholder="Search icons"
            value={query}
            onChange={(e) => {
              const text = e.target.value;
              setQuery(text);
              // Jump to a style that has matches when this one has none.
              if (icons && !search(browseStyle, text).length) {
                const other = (Object.keys(icons.iconStyles) as IconStyle[]).find(
                  (style) => search(style, text).length
                );
                if (other) setBrowseStyle(other);
              }
            }}
          />
          <div className={styles.segmented}>
            {icons &&
              (Object.keys(icons.iconStyles) as IconStyle[]).map((s) => (
                <button
                  type="button"
                  key={s}
                  aria-pressed={browseStyle === s}
                  onClick={() => setBrowseStyle(s)}
                >
                  {icons.iconStyles[s].label}
                  {query.trim() && ` (${search(s).length})`}
                </button>
              ))}
          </div>
          <div className={styles.iconGrid}>
            {!icons && <div className={styles.iconGridNote}>Loading icons…</div>}
            {icons && results.length === 0 && (
              <div className={styles.iconGridNote}>No icons found.</div>
            )}
            {results.map((i) => (
              <button
                type="button"
                key={i.name}
                title={i.name}
                aria-pressed={icon === i.name && iconStyle === browseStyle}
                onClick={() => {
                  onChange(i.name, browseStyle);
                  setOpen(false);
                }}
              >
                <IconGlyph icon={i} />
              </button>
            ))}
          </div>
          <div className={styles.iconPickerFooter}>
            <span>
              {results.length} icons
            </span>
            {icon && (
              <button
                type="button"
                onClick={() => {
                  onChange("", iconStyle);
                  setOpen(false);
                }}
              >
                Remove icon
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
