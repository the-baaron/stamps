/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useRef, useState } from "react";
import styles from "../styles/Home.module.css";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 8;
// Where the + and - buttons stop.
const STEPS = [0.25, 0.5, 1, 1.5, 2, 3, 4, 6, 8];

const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

// The live preview, zoomable with buttons or a trackpad pinch. Zooming sets
// the image's real width rather than a transform, so the SVG is redrawn
// sharp at every size instead of being scaled up as a bitmap.
export const ZoomCanvas: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [zoom, setZoom] = useState(1);
  const [natural, setNatural] = useState<{ w: number; h: number }>();
  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const measure = (img: HTMLImageElement) =>
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });

  // An image that loaded before hydration never fires onLoad for React.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth) measure(img);
  }, [src]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    // Chrome and Firefox report a trackpad pinch as a wheel event with ctrlKey.
    // Exponential scaling keeps the pinch speed even at every zoom level.
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setZoom((z) => clampZoom(z * Math.exp(-e.deltaY * 0.01)));
    };
    // Safari reports it as gesture events carrying a cumulative scale.
    let gestureStart = 1;
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      gestureStart = zoomRef.current;
    };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      setZoom(clampZoom(gestureStart * (e as unknown as { scale: number }).scale));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("gesturestart", onGestureStart);
    el.addEventListener("gesturechange", onGestureChange);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("gesturestart", onGestureStart);
      el.removeEventListener("gesturechange", onGestureChange);
    };
  }, []);

  const stepZoom = (direction: 1 | -1) =>
    setZoom((z) => {
      const next =
        direction > 0
          ? STEPS.find((s) => s > z + 0.001)
          : [...STEPS].reverse().find((s) => s < z - 0.001);
      return next ?? z;
    });

  return (
    <div className={styles.canvas} style={{ backgroundSize: `${20 * zoom}px ${20 * zoom}px` }}>
      <span className={styles.canvasLabel}>Live preview</span>
      <div className={styles.canvasViewport} ref={viewportRef}>
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          style={natural ? { width: natural.w * zoom, height: natural.h * zoom } : undefined}
          onLoad={(e) => measure(e.currentTarget)}
        />
      </div>
      <div className={styles.zoomControls} role="group" aria-label="Zoom">
        <button
          type="button"
          className={styles.tip}
          aria-label="Zoom out"
          data-tip="Zoom out"
          disabled={zoom <= STEPS[0]}
          onClick={() => stepZoom(-1)}
        >
          −
        </button>
        <button
          type="button"
          className={`${styles.zoomValue} ${styles.tip}`}
          aria-label="Reset zoom to 100%"
          data-tip="Reset to 100%"
          onClick={() => setZoom(1)}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          className={styles.tip}
          aria-label="Zoom in"
          data-tip="Zoom in"
          disabled={zoom >= STEPS[STEPS.length - 1]}
          onClick={() => stepZoom(1)}
        >
          +
        </button>
      </div>
    </div>
  );
};
