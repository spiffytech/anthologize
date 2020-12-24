import Debug from "debug";
import express from "express";

import { requireAuthn } from "../lib/middleware";

const appRouter = express.Router();
appRouter.use(requireAuthn);

appRouter.get("/event-bus", (req, res) => {
  const debug = Debug("anthologize:app:event-bus");

  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  function sendPacket(data: unknown, channel: string, id?: string) {
    res.write(`event: ${channel}\n`);
    res.write(`data: ${JSON.stringify(data)}\n`);
    if (id) res.write(`id: ${id}\n`);
    res.write("\n");
  }

  sendPacket(true, "initializing");

  process.on("SIGTERM", () => {
    res.end();
  });
  // If client closes connection, stop sending events
  res.on("close", () => {
    debug("client disconnected");
    res.end();
  });
});

export default appRouter;
