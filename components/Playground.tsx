/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useRef, useState } from "react";
import colorList from "css-color-names";
import styles from "../styles/Home.module.css";
import { IconPicker } from "./IconPicker";
import { Snippet } from "./Snippet";
import { allowedFonts } from "helpers/generateSVG/types";
import type { IconPosition, IconStyle } from "helpers/icons";
import {
  API,
  playgroundDefaults,
  stampPath,
  StampSettings,
} from "helpers/stamp";

const fonts = Object.keys(allowedFonts).filter((v) => isNaN(Number(v)));

const iconStyleLabels: Record<IconStyle, string> = {
  solid: "Solid",
  regular: "Regular",
  brands: "Brands",
};

// A colour as the API takes it, split into a 6-digit hex and an alpha (0-100).
const splitColor = (value: string) => {
  const v = value.trim();
  if (v.toLowerCase() === "transparent") return { hex: "000000", alpha: 0 };
  const named = (colorList as Record<string, string>)[v.toLowerCase()];
  if (named) return { hex: named.slice(1), alpha: 100 };
  if (/^[0-9a-f]{3,4}$/i.test(v)) {
    const full = v.replace(/./g, "$&$&");
    return {
      hex: full.slice(0, 6),
      alpha: full.length === 8 ? Math.round((parseInt(full.slice(6), 16) / 255) * 100) : 100,
    };
  }
  if (/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v))
    return {
      hex: v.slice(0, 6),
      alpha: v.length === 8 ? Math.round((parseInt(v.slice(6), 16) / 255) * 100) : 100,
    };
  return { hex: "000000", alpha: 100 };
};

const withAlpha = (hex: string, alpha: number) =>
  alpha >= 100
    ? hex
    : hex + Math.round((Math.max(0, alpha) / 100) * 255).toString(16).padStart(2, "0");

// 16px line icons for the field labels, drawn in the text colour.
const Glyph: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const icons = {
  fontSize: <Glyph><path d="M2 4V3h7v1M5.5 3v10M4 13h3M10 8V7.5h4V8M12 7.5V13M11 13h2" /></Glyph>,
  letterSpacing: <Glyph><path d="M5 10l3-7 3 7M6 8h4M1.5 13.5h13M1.5 12v3M14.5 12v3" /></Glyph>,
  padding: <Glyph><rect x="2" y="2" width="12" height="12" rx="1.5" /><rect x="5" y="5" width="6" height="6" rx="0.5" strokeDasharray="1.5 1.5" /></Glyph>,
  radius: <Glyph><path d="M3 13V8a5 5 0 0 1 5-5h5" /></Glyph>,
  minWidth: <Glyph><path d="M2 3v10M14 3v10M4.5 8h7M6.5 6l-2 2 2 2M9.5 6l2 2-2 2" /></Glyph>,
  angle: <Glyph><path d="M2.5 13.5h11M2.5 13.5L11 4M7.5 13.5a5 5 0 0 0-1.6-3.7" /></Glyph>,
  borderWidth: <Glyph><path d="M2 4h12" strokeWidth="1" /><path d="M2 8h12" strokeWidth="2" /><path d="M2 12.5h12" strokeWidth="3" /></Glyph>,
  iconSize: <Glyph><rect x="2" y="6" width="8" height="8" rx="1" /><path d="M9 2h5v5M14 2L8.5 7.5" /></Glyph>,
  iconGap: <Glyph><rect x="1.5" y="4" width="4" height="8" rx="1" /><rect x="10.5" y="4" width="4" height="8" rx="1" /><path d="M7 8h2" /></Glyph>,
  shadowX: <Glyph><path d="M2 8h11M10 5l3 3-3 3" /></Glyph>,
  shadowY: <Glyph><path d="M8 2v11M5 10l3 3 3-3" /></Glyph>,
  blur: <Glyph><circle cx="8" cy="8" r="2.5" /><circle cx="8" cy="8" r="5.5" strokeDasharray="1.5 2" /></Glyph>,
};

const clamp = (n: number, min?: number, max?: number) =>
  Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));

// A compact number field. Drag its label sideways to scrub the value, or use
// the arrow keys (with shift for steps of ten), as in Figma.
const NumField: React.FC<{
  label: React.ReactNode;
  title: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}> = ({ label, title, value, onChange, min, max, step = 1, placeholder }) => {
  const drag = useRef<{ x: number; start: number } | null>(null);
  const round = (n: number) => String(Math.round(n / step) * step);
  const nudge = (by: number) =>
    onChange(round(clamp((Number(value) || 0) + by, min, max)));

  return (
    <label className={`${styles.numField} ${styles.tip}`} data-tip={title}>
      <span
        className={styles.numLabel}
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, start: Number(value) || 0 };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const delta = Math.round((e.clientX - drag.current.x) / 2) * step;
          onChange(round(clamp(drag.current.start + delta, min, max)));
        }}
        onPointerUp={() => (drag.current = null)}
      >
        {label}
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        aria-label={title}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.-]/g, ""))}
        onKeyDown={(e) => {
          if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
          e.preventDefault();
          const by = (e.shiftKey ? 10 : 1) * step;
          nudge(e.key === "ArrowUp" ? by : -by);
        }}
      />
    </label>
  );
};

// Swatch, hex and alpha on one row, like a fill in Figma's sidebar.
const ColorRow: React.FC<{
  title: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onRemove?: () => void;
}> = ({ title, value, placeholder, onChange, onRemove }) => {
  const { hex, alpha } = splitColor(value || "000000");
  const [draft, setDraft] = useState<string>();

  return (
    <div className={styles.colorRow}>
      <label className={`${styles.swatch} ${styles.tip}`} data-tip={`${title}: pick a colour`}>
        <span style={{ background: value ? `#${withAlpha(hex, alpha)}` : "transparent" }} />
        <input
          type="color"
          value={`#${hex}`}
          aria-label={title}
          onChange={(e) => onChange(withAlpha(e.target.value.slice(1), alpha))}
        />
      </label>
      <input
        type="text"
        className={styles.hexInput}
        aria-label={`${title} hex`}
        spellCheck={false}
        maxLength={20}
        placeholder={placeholder}
        value={draft ?? (value ? (/^[0-9a-f]+$/i.test(value) ? hex : value) : "")}
        onChange={(e) => setDraft(e.target.value.replace("#", "").trim())}
        onBlur={() => {
          if (draft === undefined) return;
          const next = /^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(draft)
            ? withAlpha(splitColor(draft).hex, alpha)
            : draft;
          onChange(next);
          setDraft(undefined);
        }}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      />
      <label className={`${styles.alphaInput} ${styles.tip}`} data-tip={`${title} opacity`}>
        <input
          type="text"
          inputMode="numeric"
          aria-label={`${title} opacity`}
          value={value ? alpha : ""}
          disabled={!value}
          onChange={(e) =>
            onChange(withAlpha(hex, clamp(Number(e.target.value.replace(/\D/g, "")), 0, 100)))
          }
        />
        <span>%</span>
      </label>
      {onRemove && (
        <button
          type="button"
          className={`${styles.iconButton} ${styles.tip}`}
          onClick={onRemove}
          aria-label={`Remove ${title.toLowerCase()}`}
          data-tip={`Remove ${title.toLowerCase()}`}
        >
          −
        </button>
      )}
    </div>
  );
};

const Section: React.FC<{
  title: string;
  action?: { label: string; title: string; onClick: () => void };
  children?: React.ReactNode;
}> = ({ title, action, children }) => (
  <section className={styles.panelSection}>
    <header>
      <h3>{title}</h3>
      {action && (
        <button
          type="button"
          className={`${styles.iconButton} ${styles.tip}`}
          onClick={action.onClick}
          aria-label={action.title}
          data-tip={action.title}
        >
          {action.label}
        </button>
      )}
    </header>
    {children}
  </section>
);

const Segmented: React.FC<{
  value: string;
  options: { value: string; label: React.ReactNode; title: string }[];
  onChange: (value: string) => void;
}> = ({ value, options, onChange }) => (
  <div className={styles.segmentedSmall}>
    {options.map((o) => (
      <button
        type="button"
        key={o.value}
        className={styles.tip}
        aria-label={o.title}
        data-tip={o.title}
        aria-pressed={value === o.value}
        onClick={() => onChange(o.value)}
      >
        {o.label}
      </button>
    ))}
  </div>
);

export interface Preset {
  settings: StampSettings;
  id: number;
}

const hasShadow = (s: StampSettings) =>
  [s.shadowX, s.shadowY, s.shadowBlur].some((v) => Number(v) !== 0);

export const Playground: React.FC<{ preset?: Preset }> = ({ preset }) => {
  const [s, setS] = useState<StampSettings>(playgroundDefaults);
  const [iconStyleOptions, setIconStyleOptions] = useState<IconStyle[]>([]);
  // The picker shows while an icon is being chosen, before one is set.
  const [addingIcon, setAddingIcon] = useState(false);
  // The fill brought back by "+" after the last one was removed.
  const lastFill = useRef(playgroundDefaults.backgroundColor);
  const set = (key: keyof StampSettings) => (value: string) =>
    setS((prev) => ({ ...prev, [key]: value }));
  const update = (patch: Partial<StampSettings>) =>
    setS((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    if (preset) setS(preset.settings);
  }, [preset]);

  useEffect(() => {
    if (!s.icon) return setIconStyleOptions([]);
    import("helpers/icons").then(({ iconStyles, iconList }) =>
      setIconStyleOptions(
        (Object.keys(iconStyles) as IconStyle[]).filter((style) =>
          iconList(style).some((i) => i.name === s.icon)
        )
      )
    );
  }, [s.icon]);

  const path = stampPath(s);
  const url = `${API}${path}`;
  // Preview against the local API in development so unreleased params show.
  const previewUrl =
    process.env.NODE_ENV === "development" ? `/api/${path}` : url;

  // No fill is sent as a transparent background.
  const stops =
    s.backgroundColor.toLowerCase() === "transparent" ? [] : s.backgroundColor.split(",");
  const setStop = (i: number, value: string) =>
    set("backgroundColor")(stops.map((c, j) => (j === i ? value : c)).join(","));
  const hasBorder = Number(s.borderWidth) > 0;
  const bold = s.fontWeight === "bold" || Number(s.fontWeight) >= 600;
  const shadow = hasShadow(s);

  return (
    <div className={styles.playground}>
      <div className={styles.playgroundMain}>
        <div className={styles.canvas}>
          <span className={styles.canvasLabel}>Live preview</span>
          {/* Shown at 2x: it is an SVG, so it stays sharp. */}
          <img
            src={previewUrl}
            alt="Preview of your button"
            onLoad={(e) => {
              const img = e.currentTarget;
              img.style.width = `${img.naturalWidth * 2}px`;
            }}
          />
        </div>
        <Snippet url={url} initial="URL" />
      </div>

      <div className={styles.panel}>
        <Section title="Text">
          <input
            type="text"
            className={styles.textInput}
            aria-label="Text"
            maxLength={40}
            value={s.text}
            onChange={(e) => set("text")(e.target.value)}
          />
          <select
            className={styles.selectInput}
            aria-label="Font"
            value={s.fontFamily}
            onChange={(e) => set("fontFamily")(e.target.value)}
          >
            {fonts.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <div className={styles.textRow}>
            <div className={styles.toolbar} role="group" aria-label="Text style">
              <button
                type="button"
                className={styles.tip}
                aria-label="Bold"
                data-tip="Bold"
                aria-pressed={bold}
                onClick={() => set("fontWeight")(bold ? "normal" : "bold")}
              >
                <b>B</b>
              </button>
              <button
                type="button"
                className={styles.tip}
                aria-label="Italic"
                data-tip="Italic"
                aria-pressed={s.fontStyle === "italic"}
                onClick={() => set("fontStyle")(s.fontStyle === "italic" ? "normal" : "italic")}
              >
                <i>I</i>
              </button>
            </div>
            <NumField label={icons.fontSize} title="Font size" value={s.fontSize} min={6} max={80} onChange={set("fontSize")} />
            <NumField label={icons.letterSpacing} title="Letter spacing" value={s.letterSpacing} min={-5} max={20} step={0.5} onChange={set("letterSpacing")} />
          </div>
          <ColorRow title="Text colour" value={s.color} onChange={set("color")} />
        </Section>

        <Section title="Layout">
          <div className={styles.grid3}>
            <NumField label={icons.padding} title="Padding (empty: 8 / 16 default)" value={s.padding} min={0} max={60} placeholder="Auto" onChange={set("padding")} />
            <NumField label={icons.radius} title="Corner radius" value={s.borderRadius} min={0} max={60} onChange={set("borderRadius")} />
            <NumField label={icons.minWidth} title="Minimum width" value={s.minWidth} min={0} max={600} onChange={set("minWidth")} />
          </div>
        </Section>

        <Section
          title="Fill"
          action={
            stops.length
              ? {
                  label: "+",
                  title: "Add a gradient stop",
                  onClick: () => set("backgroundColor")(`${s.backgroundColor},${stops[stops.length - 1]}`),
                }
              : { label: "+", title: "Add a fill", onClick: () => set("backgroundColor")(lastFill.current) }
          }
        >
          {stops.map((stop, i) => (
            <ColorRow
              key={i}
              title={stops.length > 1 ? `Stop ${i + 1}` : "Background"}
              value={stop}
              onChange={(v) => setStop(i, v)}
              onRemove={() => {
                if (stops.length === 1) lastFill.current = stop;
                set("backgroundColor")(stops.filter((_, j) => j !== i).join(",") || "transparent");
              }}
            />
          ))}
          {stops.length > 1 && (
            <div className={styles.grid2}>
              <NumField label={icons.angle} title="Gradient angle: 0 up, 90 right, 180 down" value={s.gradientAngle} min={0} max={360} onChange={set("gradientAngle")} />
            </div>
          )}
        </Section>

        <Section
          title="Border"
          action={hasBorder ? undefined : { label: "+", title: "Add a border", onClick: () => set("borderWidth")("1") }}
        >
          {hasBorder && (
            <div className={styles.borderRow}>
              <NumField label={icons.borderWidth} title="Border width" value={s.borderWidth} min={1} max={20} onChange={set("borderWidth")} />
              <ColorRow title="Border" value={s.borderColor} onChange={set("borderColor")} onRemove={() => set("borderWidth")("0")} />
            </div>
          )}
        </Section>

        <Section
          title="Icon"
          action={
            s.icon
              ? { label: "−", title: "Remove the icon", onClick: () => update({ icon: "" }) }
              : { label: "+", title: "Add an icon", onClick: () => setAddingIcon(true) }
          }
        >
          {(s.icon || addingIcon) && (
            <IconPicker
              icon={s.icon}
              iconStyle={s.iconStyle as IconStyle}
              defaultOpen={!s.icon}
              onClose={() => setAddingIcon(false)}
              onChange={(icon, iconStyle) => update({ icon, iconStyle })}
            />
          )}
          {s.icon && (
            <>
              <div className={styles.grid2}>
                <Segmented
                  value={s.iconStyle}
                  onChange={set("iconStyle")}
                  options={iconStyleOptions.map((style) => ({
                    value: style,
                    label: iconStyleLabels[style],
                    title: `${iconStyleLabels[style]} style`,
                  }))}
                />
                <Segmented
                  value={s.iconPosition || "before"}
                  onChange={set("iconPosition")}
                  options={(["before", "after"] as IconPosition[]).map((p) => ({
                    value: p,
                    label: p === "before" ? "Before" : "After",
                    title: p === "before" ? "Icon before the text" : "Icon after the text",
                  }))}
                />
                <NumField label={icons.iconSize} title="Icon size (empty: matches the text)" value={s.iconSize} min={1} max={80} placeholder="Auto" onChange={set("iconSize")} />
                <NumField label={icons.iconGap} title="Space between icon and text" value={s.iconSpacing} min={0} max={60} placeholder="Auto" onChange={set("iconSpacing")} />
              </div>
              {s.iconColor ? (
                <ColorRow title="Icon colour" value={s.iconColor} onChange={set("iconColor")} onRemove={() => set("iconColor")("")} />
              ) : (
                <button type="button" className={styles.addRow} onClick={() => set("iconColor")(splitColor(s.color).hex)}>
                  + Own icon colour
                </button>
              )}
            </>
          )}
        </Section>

        <Section
          title="Shadow"
          action={
            shadow
              ? { label: "−", title: "Remove the shadow", onClick: () => update({ shadowX: "0", shadowY: "0", shadowBlur: "0" }) }
              : { label: "+", title: "Add a shadow", onClick: () => update({ shadowY: "2", shadowBlur: "6" }) }
          }
        >
          {shadow && (
            <>
              <div className={styles.grid3}>
                <NumField label={icons.shadowX} title="Shadow offset, horizontal" value={s.shadowX} min={-40} max={40} onChange={set("shadowX")} />
                <NumField label={icons.shadowY} title="Shadow offset, vertical" value={s.shadowY} min={-40} max={40} onChange={set("shadowY")} />
                <NumField label={icons.blur} title="Shadow blur" value={s.shadowBlur} min={0} max={40} onChange={set("shadowBlur")} />
              </div>
              <ColorRow title="Shadow colour" value={s.shadowColor} onChange={set("shadowColor")} />
            </>
          )}
        </Section>
      </div>
    </div>
  );
};
