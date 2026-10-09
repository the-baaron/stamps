export const API = "https://gh-stamps.vercel.app/api/";

// A stamp as the playground edits it. Values stay strings, as in the URL.
export interface StampSettings {
  text: string;
  fontFamily: string;
  fontSize: string;
  borderRadius: string;
  borderWidth: string;
  padding: string;
  backgroundColor: string;
  color: string;
  borderColor: string;
  icon: string;
  iconStyle: string;
  iconPosition: string;
  iconSpacing: string;
  shadowX: string;
  shadowY: string;
  shadowBlur: string;
  shadowColor: string;
  iconColor: string;
  iconSize: string;
  fontWeight: string;
  letterSpacing: string;
  fontStyle: string;
  minWidth: string;
  gradientAngle: string;
}

export const playgroundDefaults: StampSettings = {
  text: "Example",
  fontFamily: "helvetica",
  fontSize: "14",
  borderRadius: "4",
  borderWidth: "1",
  padding: "10",
  backgroundColor: "c2e1ff",
  color: "1d568b",
  borderColor: "90bee9",
  icon: "",
  iconStyle: "solid",
  iconPosition: "before",
  iconSpacing: "",
  shadowX: "0",
  shadowY: "0",
  shadowBlur: "0",
  shadowColor: "00000040",
  iconColor: "",
  iconSize: "",
  fontWeight: "normal",
  letterSpacing: "0",
  fontStyle: "normal",
  minWidth: "0",
  gradientAngle: "180",
};

// Params left out of the URL when they hold the API's own default.
const apiDefaults: Partial<StampSettings> = {
  fontFamily: "helvetica",
  icon: "",
  iconStyle: "solid",
  iconPosition: "before",
  shadowX: "0",
  shadowY: "0",
  shadowBlur: "0",
  shadowColor: "00000040",
  iconColor: "",
  iconSize: "",
  fontWeight: "normal",
  letterSpacing: "0",
  fontStyle: "normal",
  minWidth: "0",
  gradientAngle: "180",
};

const hasShadow = (s: StampSettings) =>
  [s.shadowX, s.shadowY, s.shadowBlur].some((v) => v !== "" && Number(v) !== 0);

export const stampPath = (s: StampSettings) => {
  const { text, ...params } = s;
  const query = Object.entries(params)
    .filter(([key, value]) => {
      if (value === "") return false;
      if (!s.icon && key.startsWith("icon")) return false;
      if (!hasShadow(s) && key.startsWith("shadow")) return false;
      if (key === "gradientAngle" && !s.backgroundColor.includes(","))
        return false;
      return apiDefaults[key as keyof StampSettings] !== value;
    })
    // Commas stay readable: they separate gradient colours.
    .map(([key, value]) => `${key}=${encodeURIComponent(value).replace(/%2C/g, ",")}`)
    .join("&");
  const label = text === "" ? "%20" : encodeURIComponent(text);
  return query ? `${label}?${query}` : label;
};

// Turns an example path like "Docs?icon=book&color=fff" into full settings.
export const parseStampPath = (path: string): StampSettings => {
  const [label, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  const settings: StampSettings = {
    ...playgroundDefaults,
    // Fields the example does not set fall back to what the API renders.
    fontSize: "14",
    borderRadius: "4",
    borderWidth: "0",
    // An empty padding is left out, so the API's own 8/16 padding applies.
    padding: "",
    backgroundColor: "0794e0",
    color: "white",
    borderColor: "0b76b0",
    text: decodeURIComponent(label),
  };
  params.forEach((value, key) => {
    if (key in settings) settings[key as keyof StampSettings] = value;
  });
  return settings;
};
