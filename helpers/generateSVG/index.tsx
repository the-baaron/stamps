import { useRef } from "react";
import { renderToString } from "react-dom/server";
import pixelWidth from "string-pixel-width";
import { Props, SvgProps } from "./types";
import colorList from "css-color-names";
import { findIcon } from "helpers/icons";

export const defaults: Props = {
  fontFamily: "helvetica",
  fontSize: 14,
  paddingTop: 8,
  paddingBottom: 8,
  paddingLeft: 16,
  paddingRight: 16,
  borderRadius: 4,
  backgroundColor: "0794e0",
  color: "white",
  borderColor: "0b76b0",
  borderWidth: 0,
  padding: 0,
};

// A query param as text, or "" when it is missing.
const str = (value: unknown) =>
  `${(Array.isArray(value) ? value[0] : value) ?? ""}`.trim();

// A query param as a number, or the fallback when it is missing or not one.
const num = (value: unknown, fallback: number) => {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return value === undefined || value === "" || isNaN(n) ? fallback : n;
};

interface Paint {
  color: string;
  opacity?: number;
}

// A colour name, "transparent", or hex without the # in RGB, RGBA, RRGGBB or
// RRGGBBAA. Alpha comes out as a separate opacity, which more SVG renderers
// understand than 8-digit hex.
const parseColor = (value: unknown, fallback = "red"): Paint => {
  const v = str(value);
  if (!v) return { color: fallback };
  if (v.toLowerCase() === "transparent") return { color: "#000000", opacity: 0 };
  if (colorList.hasOwnProperty(v)) return { color: v };
  if (/^[0-9a-f]{3,4}$|^[0-9a-f]{6}$|^[0-9a-f]{8}$/i.test(v)) {
    const hex = v.length <= 4 ? v.replace(/./g, "$&$&") : v;
    const alpha = hex.length === 8 ? parseInt(hex.slice(6), 16) / 255 : 1;
    return {
      color: `#${hex.slice(0, 6)}`,
      opacity: alpha < 1 ? Math.round(alpha * 1000) / 1000 : undefined,
    };
  }
  return { color: `#${v}` };
};

const fill = (p: Paint) => ({ fill: p.color, fillOpacity: p.opacity });
const stroke = (p: Paint) => ({ stroke: p.color, strokeOpacity: p.opacity });

// CSS gradient angles: 0 points up, 90 right, 180 (the default) down.
const gradientLine = (angle: number) => {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad) / 2;
  const dy = -Math.cos(rad) / 2;
  const r = (n: number) => Math.round(n * 1000) / 1000;
  return { x1: r(0.5 - dx), y1: r(0.5 - dy), x2: r(0.5 + dx), y2: r(0.5 + dy) };
};

const applyTransform = (text: string, transform: string) => {
  if (transform === "uppercase") return text.toUpperCase();
  if (transform === "lowercase") return text.toLowerCase();
  if (transform === "capitalize")
    return text.replace(/(^|\s)(\S)/g, (_, space, c) => space + c.toUpperCase());
  return text;
};

const Svg: React.FC<SvgProps> = (props) => {
  const settings = { ...defaults, ...props };
  if (settings.padding) {
    settings.paddingBottom = Number(settings.padding);
    settings.paddingTop = Number(settings.padding);
    settings.paddingRight = Number(settings.padding) + 4;
    settings.paddingLeft = Number(settings.padding) + 4;
  }
  const fontSize = Number(settings.fontSize);
  const paddingLeft = Number(settings.paddingLeft);
  const paddingTop = Number(settings.paddingTop);
  const text = applyTransform(`${settings.text}`, str(settings.textTransform));
  const weight = str(settings.fontWeight).toLowerCase();
  const fontWeight = /^(normal|bold|[1-9]00)$/.test(weight) ? weight : undefined;
  const bold = weight === "bold" || Number(weight) >= 600;
  const letterSpacing = num(settings.letterSpacing, 0);
  const textRef = useRef<SVGTextElement>(null);
  // Browsers add letter spacing after the last character too. Leaving that
  // gap out of the width keeps the label centred; it falls in the padding.
  const textWidth =
    pixelWidth(text, { font: settings.fontFamily, size: fontSize, bold }) +
    letterSpacing * Math.max(0, Array.from(text).length - 1);
  const icon = findIcon(settings.icon, settings.iconStyle);
  const iconHeight = icon ? Math.max(1, num(settings.iconSize, fontSize)) : 0;
  const iconWidth = icon ? (iconHeight * icon.width) / icon.height : 0;
  const hasText = text.trim() !== "";
  const iconGap =
    icon && hasText
      ? Math.max(0, num(settings.iconSpacing, Math.round(fontSize * 0.5)))
      : 0;
  const contentWidth = textWidth + iconWidth + iconGap;
  const contentHeight = Math.max(fontSize, iconHeight);
  const naturalWidth =
    contentWidth + paddingLeft + Number(settings.paddingRight);
  // A minimum width centres the content in the extra space.
  const width = Math.max(naturalWidth, num(settings.minWidth, 0));
  const startX = paddingLeft + (width - naturalWidth) / 2;
  const iconAfter = settings.iconPosition === "after";
  const iconX = iconAfter ? startX + textWidth + iconGap : startX;
  const textX = iconAfter ? startX : startX + iconWidth + iconGap;
  const height = contentHeight + paddingTop + Number(settings.paddingBottom);

  const textPaint = parseColor(settings.color);
  const iconPaint = str(settings.iconColor)
    ? parseColor(settings.iconColor)
    : textPaint;
  // Comma-separated colours make an evenly spaced gradient.
  const stops = str(settings.backgroundColor).split(",").map((c) => parseColor(c));
  const hasGradient = stops.length > 1;

  // The canvas grows by however far the shadow reaches past the button, so it
  // is never clipped. A blur of b spreads roughly b pixels, as in CSS.
  const shadowX = num(settings.shadowX, 0);
  const shadowY = num(settings.shadowY, 0);
  const shadowBlur = Math.max(0, num(settings.shadowBlur, 0));
  const hasShadow = shadowX !== 0 || shadowY !== 0 || shadowBlur > 0;
  const shadowPaint = parseColor(settings.shadowColor, "#000000");
  const left = hasShadow ? Math.max(0, shadowBlur - shadowX) : 0;
  const right = hasShadow ? Math.max(0, shadowBlur + shadowX) : 0;
  const top = hasShadow ? Math.max(0, shadowBlur - shadowY) : 0;
  const bottom = hasShadow ? Math.max(0, shadowBlur + shadowY) : 0;
  const canvasWidth = width + left + right;
  const canvasHeight = height + top + bottom;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      width={canvasWidth}
      height={canvasHeight}
      style={{ cursor: "pointer" }}
    >
      <defs>
        <style
          dangerouslySetInnerHTML={{
            __html: `
            svg, text {
              font-family: "${settings.fontFamily}", helvetica;
            }
          `,
          }}
        />
        {hasShadow && (
          <filter
            id="shadow"
            filterUnits="userSpaceOnUse"
            x={-left}
            y={-top}
            width={canvasWidth}
            height={canvasHeight}
          >
            <feDropShadow
              dx={shadowX}
              dy={shadowY}
              stdDeviation={shadowBlur / 2}
              floodColor={shadowPaint.color}
              floodOpacity={shadowPaint.opacity}
            />
          </filter>
        )}
        {hasGradient && (
          <linearGradient
            id="background"
            {...gradientLine(num(settings.gradientAngle, 180))}
          >
            {stops.map((stop, i) => (
              <stop
                key={i}
                offset={i / (stops.length - 1)}
                stopColor={stop.color}
                stopOpacity={stop.opacity}
              />
            ))}
          </linearGradient>
        )}
      </defs>
      <g transform={hasShadow ? `translate(${left} ${top})` : undefined}>
        <rect
          x={settings.borderWidth / 2}
          y={settings.borderWidth / 2}
          width={width - settings.borderWidth}
          height={height - settings.borderWidth}
          {...(hasGradient ? { fill: "url(#background)" } : fill(stops[0]))}
          rx={settings.borderRadius - settings.borderWidth / 4}
          ry={settings.borderRadius - settings.borderWidth / 4}
          strokeWidth={settings.borderWidth}
          {...stroke(parseColor(settings.borderColor))}
          filter={hasShadow ? "url(#shadow)" : undefined}
        />
        {icon && (
          <svg
            x={iconX}
            y={paddingTop + (contentHeight - iconHeight) / 2}
            width={iconWidth}
            height={iconHeight}
            viewBox={`0 0 ${icon.width} ${icon.height}`}
          >
            <path d={icon.path} {...fill(iconPaint)} />
          </svg>
        )}
        <text
          x={textX}
          y={paddingTop + (contentHeight - fontSize) / 2 + 1}
          textAnchor="start"
          alignmentBaseline="hanging"
          ref={textRef}
          {...fill(textPaint)}
          style={{
            fontFamily: `${settings.fontFamily}, helvetica`,
            fontSize: settings.fontSize,
            fontWeight,
            letterSpacing: letterSpacing || undefined,
            userSelect: "none",
            cursor: "inherit",
            pointerEvents: "none",
          }}
        >
          {text}
        </text>
      </g>
    </svg>
  );
};

// XML comments may not contain "--", so the banner must stay free of it.
const banner = [
  "         888                                                  d8b",
  "         888                                                  Y8P",
  "         888",
  ".d8888b  888888  8888b.  88888b.d88b.  88888b.  .d8888b      8888 .d8888b       .d88b.  888d888 .d88b.",
  "88K      888        \"88b 888 \"888 \"88b 888 \"88b 88K          \"888 88K          d88\"\"88b 888P\"  d88P\"88b",
  "\"Y8888b. 888    .d888888 888  888  888 888  888 \"Y8888b.      888 \"Y8888b.     888  888 888    888  888",
  "     X88 Y88b.  888  888 888  888  888 888 d88P      X88      888      X88     Y88..88P 888    Y88b 888",
  " 88888P'  \"Y888 \"Y888888 888  888  888 88888P\"   88888P'  88  888  88888P'  88  \"Y88P\"  888     \"Y88888",
  "                                       888                    888                                   888",
  "                                       888                   d88P                              Y8b d88P",
  "                                       888                 888P\"                                \"Y88P\"",
].join("\n");

// Font Awesome's attribution lives in a comment in its own SVG files. We embed
// only the path, so carry the attribution over when a stamp uses an icon.
const iconAttribution =
  "Icon: Font Awesome Free by @fontawesome - https://fontawesome.com\n" +
  "License - https://fontawesome.com/license/free (Icons: CC BY 4.0)\n" +
  "Copyright Fonticons, Inc.";

export default function generateSVG(props: SvgProps) {
  const svg = renderToString(<Svg {...props} />);
  const hasIcon = !!findIcon(props.icon, props.iconStyle);
  const comment = ["Created with\n", banner, hasIcon && `\n\n\n${iconAttribution}`]
    .filter(Boolean)
    .join("\n");
  return `<!--\n${comment}\n-->\n${svg}`;
}
