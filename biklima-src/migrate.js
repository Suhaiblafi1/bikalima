import "dotenv/config";
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL غير موجود في ملف .env");
  process.exit(1);
}

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();
console.log("✅ اتصال بقاعدة البيانات ناجح");

const sql = fs.readFileSync(path.join(__dirname, "setup-db.sql"), "utf8");
await client.query(sql);
console.log("✅ تم إنشاء جداول قاعدة البيانات بنجاح");

await client.end();
