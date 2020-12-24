import cluster from "cluster";
import * as path from "path";

import { path as appRoot } from "app-root-path";
import bsql from "better-sqlite3";

const db = bsql(path.join(process.env.DATA_DIR ?? appRoot, "db.sqlite"));

if (cluster.isMaster) {
  db.exec("PRAGMA journal_mode=WAL;");

  const migrations: string[] = [
    `create table users (
        email text PRIMARY KEY not NULL,
        scrypt text not NULL,
        salt text not NULL,
        lastSeen text not NULL
      );
  create table sessions (
        id integer primary key,
        email text not null,
        lastSeen text not NULL
      )`,
  ];
  db.transaction(() => {
    const [{ user_version: schemaVersion }] = db.pragma("user_version");
    migrations.slice(schemaVersion).map((migration) => db.exec(migration));
    db.pragma(`user_version = ${migrations.length}`);
  })();

  // SQLite can't clean up WAL checkpoints if there's always something reading
  // from the DB. You have to manually call a checkpoint with a more advanced
  // read-blocking mechanism like RESTART, or the WAL log will grow unboundedly.
  setInterval(() => {
    db.exec("PRAGMA wal_checkpoint(RESTART)");
  }, 60000 * 60);
}

export default db;
