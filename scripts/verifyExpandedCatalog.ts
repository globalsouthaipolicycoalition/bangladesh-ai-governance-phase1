import { sql } from "drizzle-orm";
import { controls, domains } from "../drizzle/schema";
import { getDb } from "../server/db";

const db = await getDb();
if (!db) throw new Error("Database is not available");
const domainCount = await db.select({ count: sql<number>`count(*)` }).from(domains);
const controlCount = await db.select({ count: sql<number>`count(*)` }).from(controls);
console.log(JSON.stringify({ domains: Number(domainCount[0]?.count ?? 0), controls: Number(controlCount[0]?.count ?? 0) }));
