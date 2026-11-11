import db from "./connection.js";

const result = db.prepare("SELECT sqlite_version() AS version").get();

console.log("SQLite connected successfully:", result);