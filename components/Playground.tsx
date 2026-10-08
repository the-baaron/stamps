/* eslint-disable @next/next/no-img-element */
import React from "react";
import { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";
import { IconPicker } from "./IconPicker";
import type { IconPosition, IconStyle } from "helpers/icons";

const iconStyleLabels: Record<IconStyle, string> = {
  solid: "Solid",
  regular: "Regular",
  brands: "Brands",
};

export const Playground: React.FC = () => {
  const [settings, setSettings] = useState({
    backgroundColor: "c2e1ff",
    color: "1d568b",
    fontSize: "14",
    borderWidth: "1",
    borderRadius: "4",
    borderColor: "90bee9",
    padding: "10",
  });
  const domain = "https://gh-stamps.vercel.app/api/";

  const [text, setText] = useState("Example");
  const [icon, setIcon] = useState("");
  const [iconStyle, setIconStyle] = useState<IconStyle>("solid");
  const [iconPosition, setIconPosition] = useState<IconPosition>("before");
  const [iconStyleOptions, setIconStyleOptions] = useState<IconStyle[]>([]);

  useEffect(() => {
    if (!icon) return setIconStyleOptions([]);
    import("helpers/icons").then(({ iconStyles, iconList }) =>
      setIconStyleOptions(
        (Object.keys(iconStyles) as IconStyle[]).filter((s) =>
          iconList(s).some((i) => i.name === icon)
        )
      )
    );
  }, [icon]);

  // Only non-default icon params go in the URL, keeping it short.
  const iconParams: Record<string, string> = icon
    ? {
        icon,
        ...(iconStyle !== "solid" && { iconStyle }),
        ...(iconPosition !== "before" && { iconPosition }),
      }
    : {};

  const query = `?${Object.entries({ ...settings, ...iconParams })
    .map(
      ([key, value]: [key: string, value: string | number]) => `${key}=${value}`
    )
    .join("&")}`;
  const path = `${text === "" ? "%20" : text}${query}`;
  const url = `${domain}${path}`;
  // Preview against the local API in development so unreleased params show.
  const previewUrl =
    process.env.NODE_ENV === "development" ? `/api/${path}` : url;

  return (
    <div className={styles.playground}>
      <div className={styles.playgroundLeft}>
        <div className={styles.playgroundPreview}>
          {domain && <img src={previewUrl} alt="Changable preview of a button" />}
        </div>
        <code className={styles.playgroundCode}>{url}</code>
      </div>
      <div className={styles.playgroundSidebar}>
        <label>
          <strong>Text:</strong> {text}
          <input
            type="text"
            maxLength={40}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <div className={styles.field}>
          <strong>Icon:</strong>
          <IconPicker
            icon={icon}
            iconStyle={iconStyle}
            onChange={(name, style) => {
              setIcon(name);
              setIconStyle(style);
            }}
          />
          {icon && (
            <>
              <strong>Icon style:</strong>
              <div className={styles.segmented}>
                {iconStyleOptions.map((s) => (
                  <button
                    type="button"
                    key={s}
                    aria-pressed={iconStyle === s}
                    onClick={() => setIconStyle(s)}
                  >
                    {iconStyleLabels[s]}
                  </button>
                ))}
              </div>
              <strong>Icon position:</strong>
              <div className={styles.segmented}>
                {(["before", "after"] as IconPosition[]).map((p) => (
                  <button
                    type="button"
                    key={p}
                    aria-pressed={iconPosition === p}
                    onClick={() => setIconPosition(p)}
                  >
                    {p === "before" ? "Before text" : "After text"}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <label>
          <strong>Font size:</strong> {settings.fontSize}px
          <input
            type="range"
            min="1"
            max="100"
            value={settings.fontSize}
            onChange={(e) =>
              setSettings({ ...settings, fontSize: e.target.value })
            }
          />
        </label>
        <label>
          <strong>Border radius:</strong> {settings.borderRadius}px
          <input
            type="range"
            min="1"
            max="100"
            value={settings.borderRadius}
            onChange={(e) =>
              setSettings({ ...settings, borderRadius: e.target.value })
            }
          />
        </label>
        <label>
          <strong>Border size:</strong> {settings.borderWidth}px
          <input
            type="range"
            min="0"
            max="10"
            value={settings.borderWidth}
            onChange={(e) =>
              setSettings({ ...settings, borderWidth: e.target.value })
            }
          />
        </label>
        <label>
          <strong>padding:</strong> {settings.padding}px
          <input
            type="range"
            min="0"
            max="100"
            value={settings.padding}
            onChange={(e) =>
              setSettings({ ...settings, padding: e.target.value })
            }
          />
        </label>
        <label>
          <strong>Border color:</strong> #{settings.borderColor}
          <input
            type="color"
            value={`#${settings.borderColor}`}
            onChange={(e) =>
              setSettings({
                ...settings,
                borderColor: e.target.value.replace("#", ""),
              })
            }
          />
        </label>
        <label>
          <strong>Text color:</strong> #{settings.color}
          <input
            type="color"
            value={`#${settings.color}`}
            onChange={(e) =>
              setSettings({
                ...settings,
                color: e.target.value.replace("#", ""),
              })
            }
          />
        </label>
        <label>
          <strong>Background color:</strong> #{settings.backgroundColor}
          <input
            type="color"
            value={`#${settings.backgroundColor}`}
            onChange={(e) =>
              setSettings({
                ...settings,
                backgroundColor: e.target.value.replace("#", ""),
              })
            }
          />
        </label>
      </div>
    </div>
  );
};
