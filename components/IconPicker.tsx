import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "../styles/Home.module.css";
import type { IconEntry, IconStyle } from "helpers/icons";

type IconsModule = typeof import("helpers/icons");

const IconGlyph: React.FC<{ icon: IconEntry }> = ({ icon }) => (
  <svg viewBox={`0 0 ${icon.width} ${icon.height}`} aria-hidden="true">
    <path d={icon.path} fill="currentColor" />
  </svg>
);

interface IconPickerProps {
  icon: string;
  iconStyle: IconStyle;
  onChange: (icon: string, iconStyle: IconStyle) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  icon,
  iconStyle,
  onChange,
}) => {
  const [icons, setIcons] = useState<IconsModule>();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [browseStyle, setBrowseStyle] = useState<IconStyle>(iconStyle);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ((open || icon) && !icons) import("helpers/icons").then(setIcons);
    if (open) searchRef.current?.focus();
  }, [open, icon, icons]);

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

  const results = useMemo(() => {
    if (!icons) return [];
    const q = query.trim().toLowerCase().replace(/\s+/g, "-");
    const list = icons.iconList(browseStyle);
    if (!q) return list;
    const starts = list.filter((i) => i.name.startsWith(q));
    const rest = list.filter(
      (i) =>
        !i.name.startsWith(q) &&
        (i.name.includes(q) || i.aliases.some((a) => a.includes(q)))
    );
    return [...starts, ...rest];
  }, [icons, query, browseStyle]);

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
            onChange={(e) => setQuery(e.target.value)}
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
                </button>
              ))}
          </div>
          <div className={styles.iconGrid}>
            {!icons && <p>Loading icons…</p>}
            {icons && results.length === 0 && <p>No icons found.</p>}
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
