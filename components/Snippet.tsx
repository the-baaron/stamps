import React, { useState } from "react";
import styles from "../styles/Home.module.css";
import { CopyButton } from "./CopyButton";

const formats = {
  URL: (url: string) => url,
  Markdown: (url: string) => `![Button](${url})`,
  "Markdown link": (url: string) =>
    `[![Button](${url})](https://www.example.com/)`,
  HTML: (url: string) => `<img src="${url}" alt="Button" />`,
  "HTML link": (url: string) =>
    `<a href="https://www.example.com/">\n  <img src="${url}" alt="Button" />\n</a>`,
};
type Format = keyof typeof formats;

export const Snippet: React.FC<{ url: string; initial?: Format }> = ({
  url,
  initial = "Markdown",
}) => {
  const [format, setFormat] = useState<Format>(initial);
  const code = formats[format](url);
  return (
    <div className={styles.snippet}>
      <div className={styles.snippetBar}>
        <div className={styles.snippetTabs} role="tablist">
          {(Object.keys(formats) as Format[]).map((f) => (
            <button
              type="button"
              role="tab"
              key={f}
              aria-selected={f === format}
              onClick={() => setFormat(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <CopyButton value={code} format={format} />
      </div>
      <pre className={styles.snippetCode}>{code}</pre>
    </div>
  );
};
