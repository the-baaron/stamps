/* eslint-disable @next/next/no-img-element */
import React from "react";
import styles from "../styles/Home.module.css";
import { API } from "helpers/stamp";

interface StampProps {
  src: string;
  tilt?: number;
  onClick?: () => void;
  title?: string;
}

// A live button from the API, mounted on a perforated postage stamp.
export const Stamp: React.FC<StampProps> = ({ src, tilt = 0, onClick, title }) => {
  const image = <img src={`${API}${src}`} alt={title ?? "Example button"} />;
  return (
    <span
      className={styles.stampShadow}
      style={{ "--tilt": `${tilt}deg` } as React.CSSProperties}
    >
      {onClick ? (
        <button type="button" className={styles.stamp} onClick={onClick} title={title}>
          {image}
        </button>
      ) : (
        <span className={styles.stamp}>{image}</span>
      )}
    </span>
  );
};
