import { createApp } from "../server/_core/app";

// Vercel preserves the /api/* request path for this catch-all function, so
// Express continues to receive /api/trpc, /api/oauth/callback and /api/health.
const app = createApp({ frontend: "none" });

export default app;
