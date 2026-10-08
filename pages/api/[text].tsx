import type { NextApiRequest, NextApiResponse } from "next";
import generateSVG from "helpers/generateSVG";
import { trackRender } from "helpers/trackRender";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>
) {
  const svg = generateSVG(req.query);
  res.setHeader("Content-Type", "image/svg+xml");
  res.status(200).send(svg);
  trackRender(req);
}
