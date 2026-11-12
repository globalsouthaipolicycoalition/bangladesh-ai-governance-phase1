import "dotenv/config";
import express, { type Express } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic } from "./vite";

type FrontendMode = "none" | "static";

export function createApp(options: { frontend?: FrontendMode } = {}): Express {
  const app = express();
  app.disable("x-powered-by");

  // A 10 MiB file expands to under 14 MiB in base64; keep bounded headroom for JSON metadata.
  app.use(express.json({ limit: "16mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true, parameterLimit: 1000 }));

  app.get("/api/health", (_req, res) => res.json({ status: "ok", runtime: process.env.VERCEL ? "vercel" : "node" }));
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });
  registerOAuthRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (options.frontend === "static") serveStatic(app);
  return app;
}
