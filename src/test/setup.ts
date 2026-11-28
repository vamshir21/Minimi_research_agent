
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const dataDirectory = path.resolve("data");

fs.mkdirSync(dataDirectory, { recursive: true });

const testDatabasePath = path.join(
  dataDirectory,
  "minimi-test.db",
);

process.env.MINIMI_DB_PATH = testDatabasePath;

const schemaPath = path.resolve(
  "src/test/test-schema.sql",
);

const schema = fs.readFileSync(schemaPath, "utf-8");

const testDb = new Database(testDatabasePath);

try {
  testDb.pragma("foreign_keys = ON");
  testDb.exec(schema);

  const tables = testDb.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
    ORDER BY name
  `).all();

  console.log("TEST DB:", testDatabasePath);
  console.log("TEST TABLES:", tables);
} finally {
  testDb.close();
}
