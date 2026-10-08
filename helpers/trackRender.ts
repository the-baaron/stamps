import type { NextApiRequest } from "next";
import { waitUntil } from "@vercel/functions";
import { OPENPANEL_API, OPENPANEL_CLIENT_ID } from "./analytics";

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

// Records one render in OpenPanel without touching the response: no cookies,
// no headers, nothing in the SVG. Sent after the image, never blocking it.
export const trackRender = (req: NextApiRequest) => {
  try {
    const secret = process.env.OPENPANEL_CLIENT_SECRET;
    if (process.env.VERCEL_ENV !== "production" || !secret) return;
    const referrer = header(req, "referer");
    const referrerHost = hostOf(referrer);
    // The site's own previews and examples are covered by site analytics.
    if (referrerHost === "stamps.js.org") return;
    const userAgent = header(req, "user-agent");
    const { text, ...params } = req.query;
    const source = sourceOf(userAgent, referrerHost);

    const body = JSON.stringify({
      type: "track",
      payload: {
        name: "stamp_rendered",
        properties: {
          text,
          ...Object.fromEntries(
            Object.entries(params).map(([k, v]) => [`param_${k}`, v])
          ),
          source,
          referrer,
          referrer_host: referrerHost,
          country: header(req, "x-vercel-ip-country"),
        },
      },
    });

    // Forward the viewer's IP and browser so OpenPanel's location and device
    // stats describe the viewer (or GitHub's proxy), not Vercel.
    const viewerIp = header(req, "x-forwarded-for")?.split(",")[0].trim();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "openpanel-client-id": OPENPANEL_CLIENT_ID,
      "openpanel-client-secret": secret,
    };
    if (viewerIp) headers["openpanel-client-ip"] = viewerIp;
    if (userAgent) headers["user-agent"] = userAgent;

    const sent = fetch(`${OPENPANEL_API}/track`, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(3000),
    }).catch(() => undefined);
    waitUntil(sent);
  } catch {
    // Tracking must never affect the image.
  }
};
