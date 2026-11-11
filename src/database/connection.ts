import Database  from "better-sqlite3";
import path from "node:path";
import fs from"node:fs";

const dataDirectory = path.resolve("data");
if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
    }

const databasePath = path.join(dataDirectory, "minimi.db");

const db = new Database(databasePath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export default db;
