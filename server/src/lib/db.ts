import cluster from "cluster";
import * as path from "path";

import Debug from "debug";
import { path as appRoot } from "app-root-path";
import bsql from "better-sqlite3";

const debug = Debug("anthologize:db");
const debugSql = Debug("anthologize:db:sql");
const debugMigrations = Debug("anthologize:db:migrate");

const db = bsql(path.join(process.env.DATA_DIR ?? appRoot, "db.sqlite"), {
  verbose:
    process.env.NODE_ENV === "production"
      ? undefined
      : (...args: any[]) => debugSql("%O", args),
});

if (cluster.isMaster) {
  db.pragma("journal_mode=WAL;");

  const migrations: string[] = [
    `create table users (
        id text PRIMARY KEY not NULL,
        email text not NULL,
        scrypt text not NULL,
        salt text not NULL,
        lastSeen text not NULL,
        unique (email)
      );
      create table sessions (
        id integer primary key not NULL,
        user text not NULL,
        lastSeen text not NULL
      )`,
    `create table items (
      id text primary key not NULL,
      owner text not null,
      body text not null,
      bodyType text not null,
      foreign key (owner) references users(id) on delete cascade,
      check (bodyType in ('line', 'longform'))
    );
    create table bullets (
      id text not NULL,
      owner text,
      bulletKey text not NULL,
      itemId text not NULL,
      parent text,
      sortOrder text not NULL,
      primary key (id),
      unique (owner, bulletKey, sortOrder),
      foreign key (itemId) references items(id) on delete cascade,
      foreign key (owner) references users(id) on delete cascade,
      foreign key (parent) references bullets (id)
      check (sortOrder not in ('a', 'z'))
    );`,
  ];
  db.transaction(() => {
    const [{ user_version: startingSchemaVersion }] = db.pragma("user_version");

    const targetSchemaVersion = migrations.length;

    if (targetSchemaVersion !== startingSchemaVersion) {
      debugMigrations(
        "Migrating from initial schema version: %d",
        startingSchemaVersion
      );
      migrations.slice(startingSchemaVersion).map((migration, i) => {
        debugMigrations("Running migration %d", startingSchemaVersion + i);
        db.exec(migration);
      });

      debugMigrations("Storing schema version: %d", targetSchemaVersion);
      db.pragma(`user_version = ${targetSchemaVersion}`);
    } else {
      debugMigrations(
        "Migrations already up to date at version %d",
        startingSchemaVersion
      );
    }
  })();

  // SQLite can't clean up WAL checkpoints if there's always something reading
  // from the DB. You have to manually call a checkpoint with a more advanced
  // read-blocking mechanism like RESTART, or the WAL log will grow unboundedly.
  setInterval(() => {
    debug("Running WAL checkpoint");
    db.pragma("wal_checkpoint(RESTART)");
    debug("WAL checkpoint complete");
  }, 3600_000);
}

export default db;
