import Debug from "debug";
import express from "express";

import { requireAuthn } from "../lib/middleware";

const appRouter = express.Router();
appRouter.use(requireAuthn);

appRouter.get("/event-bus", (req, res) => {
  const debug = Debug("anthologize:app:event-bus");
  debug("client connected");

  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Content-Type", "text/event-stream");
  // Don't wait until the connection closes to send our writes
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  debug("headers flushed");

  function sendPacket(data: unknown, channel: string, id?: string) {
    res.write(`event: ${channel}\n`);
    if (id) res.write(`id: ${id}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    debug("packet sent: %s %s %O", channel, id, data);
  }

  res.write("retry: 1000\n\n");

  sendPacket(true, "heartbeat");
  const interval = setInterval(() => sendPacket(true, "heartbeat"), 10000);

  process.on("SIGTERM", () => {
    debug("closing connection on process exit...");
    clearInterval(interval);
    res.end();
  });
  // If client closes connection, stop sending events
  res.on("close", () => {
    debug("client disconnected");
    clearInterval(interval);
    res.end();
  });
});

export default appRouter;
