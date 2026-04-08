import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Set it in your .env file.");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export {
  schema,
  schema as tables,
};

export const {
  sessionsTable,
  usersTable,
  coursesTable,
  lessonsTable,
  enrollmentsTable,
  lessonProgressTable,
  enrollmentRequestsTable,
  workbookOrdersTable,
} = schema;
