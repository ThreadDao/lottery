const fs = require("fs");
const path = require("path");
const dest = path.join(__dirname, "..", "dist", "db", "schema.sql");
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(path.join(__dirname, "..", "src", "db", "schema.sql"), dest);
console.log("Copied schema.sql to dist/db/");
