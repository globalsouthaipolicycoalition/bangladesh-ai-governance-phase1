import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: ReturnType<typeof createPool> | null = null;

const toBoundedInt = (value: string | undefined, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.floor(parsed))) : fallback;
};

function createProductionPool(databaseUrl: string) {
  const url = new URL(databaseUrl);
  const connectionLimit = toBoundedInt(process.env.DB_CONNECTION_LIMIT, 2, 1, 5);
  const connectTimeout = toBoundedInt(process.env.DB_CONNECT_TIMEOUT_MS, 10_000, 1_000, 30_000);
  const idleTimeout = toBoundedInt(process.env.DB_IDLE_TIMEOUT_MS, 60_000, 10_000, 300_000);

  // Keep provider-specific URL options intact (for example TiDB/PlanetScale
  // TLS settings), then add only the bounded serverless pool controls.
  const poolOptions = {
    connectionLimit,
    maxIdle: connectionLimit,
    idleTimeout,
    waitForConnections: true,
    queueLimit: 0,
    connectTimeout,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  };
  for (const [key, value] of Object.entries(poolOptions)) url.searchParams.set(key, String(value));
  if (process.env.MYSQL_SSL === "true" && !url.searchParams.has("ssl")) {
    url.searchParams.set("ssl", JSON.stringify({ rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== "false" }));
  }

  return createPool(url.toString());
}

// Lazily create one small pool per warm Vercel function instance. This avoids a
// new TCP connection for every request while keeping concurrency bounded.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = createProductionPool(process.env.DATABASE_URL);
      // mysql2 ships separate promise/base pool type declarations; Drizzle's
      // runtime accepts the promise pool, so keep the boundary explicit here.
      _db = drizzle(_pool) as unknown as ReturnType<typeof drizzle>;
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _pool = null;
      _db = null;
    }
  }
  return _db;
}

export async function closeDb() {
  if (_pool) await _pool.end();
  _pool = null;
  _db = null;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    throw new Error("Database is not available");
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.
