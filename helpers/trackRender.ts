import type { NextApiRequest } from "next";
import { waitUntil } from "@vercel/functions";
import { POSTHOG_HOST, POSTHOG_KEY } from "./analytics";

const header = (req: NextApiRequest, name: string) => {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
};

const hostOf = (url?: string) => {
  try {
    return url ? new URL(url).host : undefined;
  } catch {
    return undefined;
  }
};

// Where a stamp is shown. GitHub proxies README images through camo, which
// drops the referrer, so GitHub use is recognisable but not per repo.
const sourceOf = (userAgent = "", referrerHost?: string) => {
  if (/github-camo/i.test(userAgent)) return "github";
  if (referrerHost) return "website";
  if (/bot|crawl|spider|preview|slack|discord|telegram/i.test(userAgent))
    return "bot";
  return "unknown";
};

// Records one render in PostHog without touching the response: no cookies,
// no headers, nothing in the SVG. Sent after the image, never blocking it.
export const trackRender = (req: NextApiRequest) => {
  try {
    if (process.env.VERCEL_ENV !== "production") return;
    const referrer = header(req, "referer");
    const referrerHost = hostOf(referrer);
    // The site's own previews and examples are covered by site analytics.
    if (referrerHost === "stamps.js.org") return;
    const userAgent = header(req, "user-agent");
    const { text, ...params } = req.query;
    const source = sourceOf(userAgent, referrerHost);

    const body = JSON.stringify({
      api_key: POSTHOG_KEY,
      event: "stamp rendered",
      distinct_id: `stamps:${referrerHost ?? source}`,
      properties: {
        app: "stamps",
        text,
        ...Object.fromEntries(
          Object.entries(params).map(([k, v]) => [`param_${k}`, v])
        ),
        source,
        referrer,
        referrer_host: referrerHost,
        user_agent: userAgent,
        country: header(req, "x-vercel-ip-country"),
        // The request IP is Vercel's or GitHub's, not the viewer's.
        $geoip_disable: true,
        $process_person_profile: false,
      },
    });

    const sent = fetch(`${POSTHOG_HOST}/i/v0/e/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(3000),
    }).catch(() => undefined);
    waitUntil(sent);
  } catch {
    // Tracking must never affect the image.
  }
};
