
import { readFileSync } from "node:fs";
import db from "./connection.js";

try {
  const schema = readFileSync(
    new URL("./schema.sql", import.meta.url),
    "utf-8"
  );

  db.exec(schema);

  const tables = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
    AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all();

  console.log("Database schema created successfully.");
  console.log("Tables:", tables);
} catch (error) {
  console.error("Database migration failed:", error);
  process.exitCode = 1;
} finally {
  db.close();
}
