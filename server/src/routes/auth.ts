import crypto from "crypto";
import { promisify } from "util";

import Debug from "debug";
import express from "express";
import Joi, { ValidationError } from "joi";

import db from "../lib/db";
import { User } from "../lib/types";
import validators from "../lib/validators";

import * as Item from "../shared/Item";
import * as Bullet from "../shared/Bullet";
import * as sortOrder from "../shared/sortOrder";

async function scrypt(passwd: string, salt: string): Promise<Buffer> {
  // Who knows why TS is infering this return value as 'unknown'
  return (await promisify(crypto.scrypt)(
    passwd,
    Buffer.from(salt, "hex"),
    256 / 8
  )) as Buffer;
}

const debugBaseKey = "anthologize:routers:auth";

function seedNewUserData(email: string) {
  const debug = Debug(`${debugBaseKey}:signup:seed-data`);
  debug("Seeding new user data for %s", email);

  const rootNode = Item.create("", email);
  db.prepare(
    "insert into items (id, ownerEmail, body, bodyType) values (?, ?, ?, 'line')"
  ).run(rootNode.id, email, rootNode.body);

  const userNode = Bullet.create({
    itemId: rootNode.id,
    indent: 0,
    sortOrder: sortOrder.between(null, null),
    ownerEmail: email,
  });
  db.prepare(
    "insert into bullets (bulletKey, ownerEmail, itemId, indent, sortOrder) values (?, ?, ?, ?, ?)"
  ).run(
    userNode.bulletKey,
    email,
    userNode.itemId,
    userNode.indent,
    userNode.sortOrder
  );

  debug(
    "Seeding complete for %s: root node bulletKey: %s / item ID: %s",
    email,
    userNode.bulletKey,
    rootNode.id
  );
}

function createSession(email: string): number {
  return db
    .prepare(
      "insert into sessions (email, lastSeen) values (?, datetime('now', 'localtime'))"
    )
    .run(email)["lastInsertRowid"] as number;
}

const authRouter = express.Router();

authRouter.post("/login-signup", async (req, res) => {
  const debug = Debug(`${debugBaseKey}:login-signup`);

  const { email, password, passwordAgain } = req.body;

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
    debug(
      'Submitted credentials not formatted properly: "%s" / "%s". Joi errors: %O',
      email,
      password,
      errors
    );
    return void res.json({ errors });
  }

  const existingUser: User | undefined = db
    .prepare("select * from users where email=?")
    .get(email);

  if (!existingUser) {
    debug("User does not exist: %s", email);
    if (!passwordAgain) {
      debug("Nonexistant user tried to log in instead of sign up");
      res.status(403);
      return void res.json({
        error: "Credentials didn't match an existing user's email+password",
      });
    }

    if (password !== passwordAgain) {
      debug("User signed up with non-matching password fields");
      res.status(403);
      return void res.json({ error: "Passwords do not match" });
    }

    debug("Creating DB entry for new user %s", email);

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

    seedNewUserData(email);

    debug("New user creation finished: %s", email);
    return void res.send("success");
  }

  const candidateHash = await scrypt(password, existingUser.salt);
  const credentialsMatch = crypto.timingSafeEqual(
    Buffer.from(existingUser.scrypt, "hex"),
    candidateHash
  );

  if (!credentialsMatch) {
    debug("Submitted password doesn't match database hash");
    res.status(403);
    res.json({
      error: "Credentials didn't match an existing user's email+password",
    });
  }

  debug("User credentials authenticated. Preparing user session.");

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
