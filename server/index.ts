import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createAiProvider } from "./ai";
import { env } from "./env";
import { apiRouter } from "./routes";
import { createStore } from "./store";
import { Studio } from "./studio";

async function main() {
  const store = createStore(env.databaseUrl);
  await store.init();
  const studio = new Studio(store, createAiProvider());

  const app = express();
  app.disable("x-powered-by");
  app.use("/api", apiRouter(studio));

  const here = path.dirname(fileURLToPath(import.meta.url));
  if (env.production) {
    const clientDir = path.resolve(here, "client");
    app.use(express.static(clientDir, { index: false, maxAge: "1h" }));
    app.get(/.*/, (_req, res) => res.sendFile(path.join(clientDir, "index.html")));
  } else {
    // Dev: Vite runs inside the same process and port, so Replit only needs one port.
    const { createServer } = await import("vite");
    const vite = await createServer({ server: { middlewareMode: true }, appType: "spa", configFile: path.resolve(here, "../vite.config.ts") });
    app.use(vite.middlewares);
  }

  app.listen(env.port, "0.0.0.0", () => {
    console.log(`[vanguard-draft] http://localhost:${env.port} · storage=${store.kind} · ai=${studio.ai.mode} · drawings=${env.drawingQuality} · renders=${env.renderQuality}`);
    if (store.kind === "memory") console.warn("[vanguard-draft] DATABASE_URL not set — builds are kept in memory and lost on restart.");
    if (studio.ai.mode === "mock") console.warn("[vanguard-draft] Mock AI mode — set OPENAI_API_KEY (and unset AI_MODE=mock) for real images.");
  });
}

main().catch(error => {
  console.error("[vanguard-draft] failed to start", error);
  process.exit(1);
});
