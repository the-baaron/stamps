import React, { useState } from "react";
import styles from "../styles/Home.module.css";

export const CopyButton: React.FC<{ value: string; label?: string }> = ({
  value,
  label = "Copy",
}) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={styles.copyButton}
      onClick={() =>
        navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        })
      }
    >
      {copied ? "Copied" : label}
    </button>
  );
};
