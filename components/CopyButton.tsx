import React, { useState } from "react";
import posthog from "posthog-js";
import styles from "../styles/Home.module.css";

export const CopyButton: React.FC<{
  value: string;
  label?: string;
  format?: string;
}> = ({ value, label = "Copy", format }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={styles.copyButton}
      onClick={() =>
        navigator.clipboard.writeText(value).then(() => {
          posthog.capture("snippet copied", { format, snippet: value });
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        })
      }
    >
      {copied ? "Copied" : label}
    </button>
  );
};
