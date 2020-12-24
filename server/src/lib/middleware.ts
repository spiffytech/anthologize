import { Request, Response, NextFunction } from "express";

import db from "./db";

export function requireAuthn(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.id) {
    res.status(403);
    return void res.json({
      error: "You must be logged in to access that route",
    });
  }

  next();
}

export function refreshSession(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (!req.session) req.session = {};

  if (
    new Date().getTime() - new Date(req.session!.lastSessionLookup).getTime() >
    60000
  ) {
    const sessionRecord = db
      .prepare("select id from sessions where id=?")
      .get(req.session!.id);
    // User's session has been logged out
    if (!sessionRecord) {
      req.session = {};
    } else {
      req.session!.lastSessionLookup = new Date().toISOString();
    }
  }

  req.session.lastSeen = new Date().toISOString();
  next();
}
