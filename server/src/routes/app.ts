import Debug from "debug";
import express from "express";

import type Item from "../shared/Item";
import type Bullet from "../shared/Bullet";

import db from "../lib/db";
import { requireAuthn } from "../lib/middleware";

const dbFetchBullets = db.prepare(
  "select * from bullets where owner = ? order by sortOrder asc"
);
const dbFetchItems = db.prepare("select * from items where id in (?)");

const appRouter = express.Router();
appRouter.use(requireAuthn);

function loadInitialStreamData(
  owner: string
): { items: Item[]; bullets: Bullet[] } {
  return db.transaction(() => {
    const bullets: Bullet[] = dbFetchBullets.all(owner);
    const items: Item[] = dbFetchItems.all(
      Array.from(new Set(bullets.map((bullet) => bullet.itemId)))
    );

    return { bullets, items };
  })();
}

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
    if (channel !== "heartbeat") {
      debug("packet sent: %s %s %O", channel, id, data);
    }
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

  console.log("Loading data for user %s", res.locals.user);
  const initialData = loadInitialStreamData(res.locals.user);
  sendPacket(initialData, "all-data");
});

export default appRouter;
