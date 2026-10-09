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
    <label className={styles.numField} title={title}>
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
      <label className={styles.swatch} title={`${title}: pick a colour`}>
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
      <label className={styles.alphaInput} title={`${title} opacity`}>
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
        <button type="button" className={styles.iconButton} onClick={onRemove} title={`Remove ${title.toLowerCase()}`}>
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
        <button type="button" className={styles.iconButton} onClick={action.onClick} title={action.title}>
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
        title={o.title}
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

  const stops = s.backgroundColor.split(",");
  const setStop = (i: number, value: string) =>
    set("backgroundColor")(stops.map((c, j) => (j === i ? value : c)).join(","));
  const hasBorder = Number(s.borderWidth) > 0;
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
          <div className={styles.grid2}>
            <select
              className={styles.selectInput}
              aria-label="Weight"
              value={s.fontWeight}
              onChange={(e) => set("fontWeight")(e.target.value)}
            >
              <option value="normal">Regular</option>
              <option value="bold">Bold</option>
            </select>
            <NumField label="Aa" title="Font size" value={s.fontSize} min={6} max={80} onChange={set("fontSize")} />
            <NumField label="|A|" title="Letter spacing" value={s.letterSpacing} min={-5} max={20} step={0.5} onChange={set("letterSpacing")} />
            <Segmented
              value={s.textTransform}
              onChange={set("textTransform")}
              options={[
                { value: "none", label: "—", title: "As typed" },
                { value: "uppercase", label: "AA", title: "Uppercase" },
                { value: "lowercase", label: "aa", title: "Lowercase" },
                { value: "capitalize", label: "Aa", title: "Capitalise" },
              ]}
            />
          </div>
          <ColorRow title="Text colour" value={s.color} onChange={set("color")} />
        </Section>

        <Section title="Layout">
          <div className={styles.grid3}>
            <NumField label="P" title="Padding (empty for the default 8 / 16)" value={s.padding} min={0} max={60} placeholder="Auto" onChange={set("padding")} />
            <NumField label="R" title="Corner radius" value={s.borderRadius} min={0} max={60} onChange={set("borderRadius")} />
            <NumField label="W" title="Minimum width (0 for none)" value={s.minWidth} min={0} max={600} onChange={set("minWidth")} />
          </div>
        </Section>

        <Section
          title="Fill"
          action={{
            label: "+",
            title: "Add a gradient stop",
            onClick: () => set("backgroundColor")(`${s.backgroundColor},${stops[stops.length - 1]}`),
          }}
        >
          {stops.map((stop, i) => (
            <ColorRow
              key={i}
              title={stops.length > 1 ? `Stop ${i + 1}` : "Background"}
              value={stop}
              onChange={(v) => setStop(i, v)}
              onRemove={
                stops.length > 1
                  ? () => set("backgroundColor")(stops.filter((_, j) => j !== i).join(","))
                  : undefined
              }
            />
          ))}
          {stops.length > 1 && (
            <div className={styles.grid2}>
              <NumField label="°" title="Gradient angle (0 up, 90 right, 180 down)" value={s.gradientAngle} min={0} max={360} onChange={set("gradientAngle")} />
            </div>
          )}
        </Section>

        <Section
          title="Border"
          action={hasBorder ? undefined : { label: "+", title: "Add a border", onClick: () => set("borderWidth")("1") }}
        >
          {hasBorder && (
            <div className={styles.borderRow}>
              <NumField label="W" title="Border width" value={s.borderWidth} min={1} max={20} onChange={set("borderWidth")} />
              <ColorRow title="Border" value={s.borderColor} onChange={set("borderColor")} onRemove={() => set("borderWidth")("0")} />
            </div>
          )}
        </Section>

        <Section title="Icon">
          <IconPicker
            icon={s.icon}
            iconStyle={s.iconStyle as IconStyle}
            onChange={(icon, iconStyle) => update({ icon, iconStyle })}
          />
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
                <NumField label="S" title="Icon size (empty to match the text)" value={s.iconSize} min={1} max={80} placeholder="Auto" onChange={set("iconSize")} />
                <NumField label="Gap" title="Space between icon and text (empty for half the font size)" value={s.iconSpacing} min={0} max={60} placeholder="Auto" onChange={set("iconSpacing")} />
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
                <NumField label="X" title="Shadow offset X" value={s.shadowX} min={-40} max={40} onChange={set("shadowX")} />
                <NumField label="Y" title="Shadow offset Y" value={s.shadowY} min={-40} max={40} onChange={set("shadowY")} />
                <NumField label="B" title="Shadow blur" value={s.shadowBlur} min={0} max={40} onChange={set("shadowBlur")} />
              </div>
              <ColorRow title="Shadow colour" value={s.shadowColor} onChange={set("shadowColor")} />
            </>
          )}
        </Section>
      </div>
    </div>
  );
};
