import dotenv from "dotenv";
dotenv.config();

import * as path from "path";

import { path as appRoot } from "app-root-path";
import bodyParser from "body-parser";
import cookieSession from "cookie-session";
import Debug from "debug";
import express from "express";
import morgan from "morgan";
import Parcel from "parcel-bundler";

import { refreshSession } from "./lib/middleware";

import appRouter from "./routes/app";
import authRouter from "./routes/auth";

const debug = Debug("anthologize:main");

const app = express();

if (!process.env.SESSION_KEY) {
  throw new Error("Must supply SESSION_KEY environment variable");
}

app.use(morgan("combined"));
app.use(
  cookieSession({
    name: "anthologize-session",
    keys: [process.env.SESSION_KEY],
    expires: new Date(new Date().getTime() + 1000 * 86400 * 14),
    sameSite: "strict",
    httpOnly: true,
    // If always set to true, can't sign up in dev
    secure: process.env.NODE_ENV === "production",
  })
);
app.use(bodyParser.json());
app.use(refreshSession);

app.use("/api/auth", authRouter);
app.use("/api/app", appRouter);

if (process.env.NODE_ENV !== "production") {
  app.use(
    new Parcel(
      path.join(appRoot, "..", "crankjs", "public", "index.html")
    ).middleware()
  );
}

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  debug("Running on port %d", port);
});

process.on("SIGTERM", () => {
  server.close((err) => {
    if (err) throw err;
    process.exit(0);
  });
});
