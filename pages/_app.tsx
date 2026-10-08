import "../styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { startTracking } from "helpers/track";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    startTracking();
  }, []);

  return <Component {...pageProps} />;
}
