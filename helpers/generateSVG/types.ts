import { CSSProperties } from "react";

export enum allowedFonts {
  "helvetica",
  "andale mono",
  "arial",
  "avenir",
  "avenir next",
  "comic sans ms",
  "courier new",
  "georgia",
  "impact",
  "quantify",
  "tahoma",
  "times new roman",
  "trebuchet ms",
  "verdana",
  "webdings",
}
export type AllowedFonts = keyof typeof allowedFonts | undefined;

export interface Props {
  fontFamily: AllowedFonts;
  fontSize: number;
  paddingTop: number;
  paddingLeft: number;
  paddingBottom: number;
  paddingRight: number;
  borderRadius: number;
  backgroundColor: CSSProperties["backgroundColor"];
  color: CSSProperties["color"];
  borderColor: CSSProperties["borderColor"];
  borderWidth: number;
  padding: number;
}

export interface SvgProps extends Partial<Props> {
  text?: string | string[];
  icon?: string | string[];
  iconStyle?: string | string[];
  iconPosition?: string | string[];
}

