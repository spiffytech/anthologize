import crypto from "crypto";
import { promisify } from "util";

import express from "express";
import Joi, { ValidationError } from "joi";

import db from "../lib/db";
import { User } from "../lib/types";
import validators from "../lib/validators";

async function scrypt(passwd: string, salt: string): Promise<Buffer> {
  // Who knows why TS is infering this return value as 'unknown'
  return (await promisify(crypto.scrypt)(
    passwd,
    Buffer.from(salt, "hex"),
    256 / 8
  )) as Buffer;
}

const authRouter = express.Router();

authRouter.post("/login-signup", async (req, res) => {
  const { email, password, passwordAgain } = req.body;

  function createSession(email: string): number {
    return db
      .prepare(
        "insert into sessions (email, lastSeen) values (?, datetime('now', 'localtime'))"
      )
      .run(email)["lastInsertRowid"] as number;
  }

  try {
    Joi.assert(
      { email, password },
      Joi.object({
        email: validators.email,
        password: validators.password,
      })
    );
  } catch (ex) {
    res.status(400);
    const errors = ex.details.map((detail: ValidationError) => detail.message);
    return void res.json({ errors });
  }

  const existingUser: User | undefined = db
    .prepare("select * from users where email=?")
    .get(email);

  if (!existingUser) {
    if (!passwordAgain) {
      res.status(403);
      return void res.json({
        error: "Credentials didn't match an existing user's email+password",
      });
    }

    if (password !== passwordAgain) {
      res.status(403);
      return void res.json({ error: "Passwords do not match" });
    }

    const salt = crypto.randomBytes(256 / 8).toString("hex");
    const hash = await scrypt(password, salt);
    db.prepare(
      "insert into users (email, scrypt, salt, lastSeen) values (?, ?, ?, datetime('now', 'localtime'))"
    ).run(email, hash.toString("hex"), salt);

    req.session!.id = db
      .prepare(
        "insert into sessions (email, lastSeen) values (?, datetime('now', 'localtime'))"
      )
      .run(email)["lastInsertRowid"] as number;

    req.session!.email = email;
    req.session!.lastSessionLookup = new Date().toISOString();

    return void res.send();
  }

  const candidateHash = await scrypt(password, existingUser.salt);
  const credentialsMatch = crypto.timingSafeEqual(
    Buffer.from(existingUser.scrypt, "hex"),
    candidateHash
  );

  if (!credentialsMatch) {
    res.status(403);
    res.json({
      error: "Credentials didn't match an existing user's email+password",
    });
  }

  db.prepare(
    "update users set lastSeen=datetime('now', 'localtime') where email=?"
  ).run(existingUser.email);

  req.session!.id = createSession(existingUser.email);
  req.session!.email = existingUser.email;
  req.session!.lastSessionLookup = new Date().toISOString();

  res.send();
});

authRouter.get("/check", (req, res) => {
  if (!req.session?.id) {
    res.status(403);
    return void res.send();
  }
  res.send();
});

export default authRouter;
