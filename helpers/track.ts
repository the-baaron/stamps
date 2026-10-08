import type { OpenPanel } from "@openpanel/web";
import { OPENPANEL_API, OPENPANEL_CLIENT_ID } from "./analytics";

let op: OpenPanel | undefined;

// Starts site analytics on the live site only. OpenPanel is cookieless.
export const startTracking = async () => {
  if (op || window.location.hostname !== "stamps.js.org") return;
  const { OpenPanel } = await import("@openpanel/web");
  op = new OpenPanel({
    apiUrl: OPENPANEL_API,
    clientId: OPENPANEL_CLIENT_ID,
    trackScreenViews: true,
    trackOutgoingLinks: true,
    trackAttributes: true,
  });
};

export const track = (name: string, properties?: Record<string, unknown>) => {
  op?.track(name, properties);
};
