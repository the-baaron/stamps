/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from "react";
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

const toHex = (value: string) => {
  const named = (colorList as Record<string, string>)[value.toLowerCase()];
  if (named) return named;
  return /^[0-9a-f]{6}$/i.test(value) ? `#${value}` : "#000000";
};

const ColorField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => (
  <label className={styles.colorField}>
    <span className={styles.fieldLabel}>{label}</span>
    <span className={styles.colorInputs}>
      <input
        type="color"
        value={toHex(value)}
        onChange={(e) => onChange(e.target.value.replace("#", ""))}
      />
      <input
        type="text"
        value={value}
        spellCheck={false}
        maxLength={20}
        onChange={(e) => onChange(e.target.value.replace("#", "").trim())}
      />
    </span>
  </label>
);

const Slider: React.FC<{
  label: string;
  value: string;
  min: number;
  max: number;
  emptyLabel?: string;
  onChange: (value: string) => void;
}> = ({ label, value, min, max, emptyLabel, onChange }) => (
  <label className={styles.slider}>
    <span className={styles.fieldLabel}>
      {label}
      <span>{value === "" ? emptyLabel : `${value}px`}</span>
    </span>
    <input
      type="range"
      min={min}
      max={max}
      value={value === "" ? min : value}
      onChange={(e) => onChange(e.target.value)}
    />
  </label>
);

export interface Preset {
  settings: StampSettings;
  id: number;
}

export const Playground: React.FC<{ preset?: Preset }> = ({ preset }) => {
  const [s, setS] = useState<StampSettings>(playgroundDefaults);
  const [iconStyleOptions, setIconStyleOptions] = useState<IconStyle[]>([]);
  const set = (key: keyof StampSettings) => (value: string) =>
    setS((prev) => ({ ...prev, [key]: value }));

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

      <div className={styles.controls}>
        <fieldset>
          <legend>Content</legend>
          <label>
            <span className={styles.fieldLabel}>Text</span>
            <input
              type="text"
              maxLength={40}
              value={s.text}
              onChange={(e) => set("text")(e.target.value)}
            />
          </label>
          <label>
            <span className={styles.fieldLabel}>Font</span>
            <select
              value={s.fontFamily}
              onChange={(e) => set("fontFamily")(e.target.value)}
            >
              {fonts.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <div>
            <span className={styles.fieldLabel}>Icon</span>
            <IconPicker
              icon={s.icon}
              iconStyle={s.iconStyle as IconStyle}
              onChange={(icon, iconStyle) =>
                setS((prev) => ({ ...prev, icon, iconStyle }))
              }
            />
          </div>
          {s.icon && (
            <>
              <div>
                <span className={styles.fieldLabel}>Icon style</span>
                <div className={styles.segmented}>
                  {iconStyleOptions.map((style) => (
                    <button
                      type="button"
                      key={style}
                      aria-pressed={s.iconStyle === style}
                      onClick={() => set("iconStyle")(style)}
                    >
                      {iconStyleLabels[style]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className={styles.fieldLabel}>Icon position</span>
                <div className={styles.segmented}>
                  {(["before", "after"] as IconPosition[]).map((p) => (
                    <button
                      type="button"
                      key={p}
                      aria-pressed={(s.iconPosition || "before") === p}
                      onClick={() => set("iconPosition")(p)}
                    >
                      {p === "before" ? "Before text" : "After text"}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </fieldset>

        <fieldset>
          <legend>Shape</legend>
          <Slider label="Font size" value={s.fontSize} min={6} max={60} onChange={set("fontSize")} />
          <Slider label="Padding" value={s.padding} min={0} max={60} emptyLabel="auto" onChange={set("padding")} />
          <Slider label="Corner radius" value={s.borderRadius} min={0} max={60} onChange={set("borderRadius")} />
          <Slider label="Border" value={s.borderWidth} min={0} max={10} onChange={set("borderWidth")} />
        </fieldset>

        <fieldset>
          <legend>Colour</legend>
          <ColorField label="Background" value={s.backgroundColor} onChange={set("backgroundColor")} />
          <ColorField label="Text and icon" value={s.color} onChange={set("color")} />
          <ColorField label="Border" value={s.borderColor} onChange={set("borderColor")} />
        </fieldset>
      </div>
    </div>
  );
};
