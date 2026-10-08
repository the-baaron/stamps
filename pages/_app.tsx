import "../styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import posthog from "posthog-js";
import { POSTHOG_HOST, POSTHOG_KEY } from "helpers/analytics";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (window.location.hostname !== "stamps.js.org") return;
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      // Memory only: no cookies or storage, so no consent banner is needed.
      persistence: "memory",
      person_profiles: "identified_only",
    });
    posthog.register({ app: "stamps" });
  }, []);

  return <Component {...pageProps} />;
}
