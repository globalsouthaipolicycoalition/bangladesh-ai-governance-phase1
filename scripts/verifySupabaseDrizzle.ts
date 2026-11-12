import { sql } from "drizzle-orm";
import { closeDb, getDb } from "../server/db";
import { users } from "../drizzle/schema";

type Check = { status: "PASS" | "FAIL" | "SKIP" | "NOT_CONFIGURED"; detail: string };

const checks: Record<string, Check> = {};

function pass(name: string, detail: string) {
  checks[name] = { status: "PASS", detail };
}
function fail(name: string, detail: string) {
  checks[name] = { status: "FAIL", detail };
}
function skip(name: string, detail: string) {
  checks[name] = { status: "SKIP", detail };
}
function notConfigured(name: string, detail: string) {
  checks[name] = { status: "NOT_CONFIGURED", detail };
}

async function verifySupabaseAuth() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

  if (!url || !anonKey) {
    notConfigured(
      "supabase.config",
      "Set SUPABASE_URL and SUPABASE_ANON_KEY to run the Supabase Auth check.",
    );
    skip("supabase.auth", "Skipped because Supabase is not configured in this project.");
    return;
  }

  pass("supabase.config", `Configured for ${new URL(url).origin}`);
  if (!accessToken) {
    skip(
      "supabase.auth",
      "Set SUPABASE_ACCESS_TOKEN to verify an authenticated user. The anon key alone cannot prove a logged-in session.",
    );
    return;
  }

  try {
    const response = await fetch(`${url}/auth/v1/user`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const body = await response.json().catch(() => null) as { id?: string; email?: string; msg?: string; message?: string } | null;
    if (!response.ok || !body?.id) {
      fail("supabase.auth", `Auth API returned ${response.status}: ${body?.msg ?? body?.message ?? "No user returned"}`);
      return;
    }
    pass("supabase.auth", `Authenticated Supabase user ${body.email ?? body.id}`);
  } catch (error) {
    fail("supabase.auth", error instanceof Error ? error.message : String(error));
  }
}

async function verifyDrizzleMySql() {
  if (!process.env.DATABASE_URL) {
    notConfigured("drizzle.config", "DATABASE_URL is not set.");
    return;
  }

  try {
    const db = await getDb();
    if (!db) {
      fail("drizzle.mysql", "Drizzle did not create a MySQL pool.");
      return;
    }
    const [health] = await db.execute(sql`SELECT 1 AS ok`);
    const rows = await db.select({ id: users.id }).from(users).limit(1);
    const healthRow = Array.isArray(health) ? health[0] : health;
    if (!healthRow || Number((healthRow as { ok?: number }).ok) !== 1) {
      fail("drizzle.mysql", "MySQL health query did not return ok=1.");
      return;
    }
    pass("drizzle.mysql", `Connected through Drizzle mysql2 pool; users table is readable (${rows.length ? "has data" : "empty"}).`);
  } catch (error) {
    fail("drizzle.mysql", error instanceof Error ? error.message : String(error));
  }
}

async function main() {
  await Promise.all([verifySupabaseAuth(), verifyDrizzleMySql()]);

  console.log("\nAAGRA Supabase + Drizzle verification\n");
  for (const [name, check] of Object.entries(checks)) {
    console.log(`${check.status.padEnd(16)} ${name}: ${check.detail}`);
  }

  const hasFailure = Object.values(checks).some(check => check.status === "FAIL");
  const supabaseConfigured = checks["supabase.config"]?.status === "PASS";
  const authPassed = checks["supabase.auth"]?.status === "PASS";
  const drizzlePassed = checks["drizzle.mysql"]?.status === "PASS";

  if (supabaseConfigured && authPassed && drizzlePassed) {
    console.log("\nRESULT: Supabase Auth and the existing Drizzle MySQL connection work independently.");
    console.log("IMPORTANT: This does not mean Supabase is the database behind Drizzle. The current AAGRA schema uses MySQL, not Supabase Postgres.");
  } else if (!supabaseConfigured) {
    console.log("\nRESULT: NOT_CONFIGURED — Supabase is not connected to this project.");
  } else if (hasFailure) {
    console.log("\nRESULT: FAILED — review the failing checks above.");
  } else {
    console.log("\nRESULT: PARTIAL — provide an access token and/or fix the skipped checks.");
  }

  await closeDb();
  process.exitCode = hasFailure ? 1 : 0;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
