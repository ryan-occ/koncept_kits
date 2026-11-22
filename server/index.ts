import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createAccessGate } from "./access-gate";
import { createAiProvider } from "./ai";
import { env } from "./env";
import { apiRouter } from "./routes";
import { createStore } from "./store";
import { VehicleLibrary } from "./vehicles/library";
import { createVehicleStore } from "./vehicles/store";
import { Studio } from "./studio";

async function main() {
  const accessGate = createAccessGate({
    passcode: env.passcode,
    sessionSecret: env.sessionSecret,
    production: env.production,
  });
  const store = createStore(env.databaseUrl);
  await store.init();
  const ai = createAiProvider();
  const vehicleStore = createVehicleStore(env.databaseUrl);
  await vehicleStore.init();
  const vehicles = new VehicleLibrary(vehicleStore, ai, {
    onUsage: (inputTokens, outputTokens) => store.recordUsage("research", inputTokens, outputTokens),
  });
  // Weekly NHTSA check needs somewhere to keep its results; without a database use "Check now" instead.
  if (env.databaseUrl) vehicles.startSchedule();
  const studio = new Studio(store, ai, undefined, vehicles);

  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use("/api", accessGate.router);
  app.use("/api", apiRouter(studio, vehicles));

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
    if (accessGate.enabled) console.log("[vanguard-draft] six-digit access gate enabled");
    else console.warn("[vanguard-draft] PASSCODE not set — access gate is disabled outside production.");
    if (store.kind === "memory") console.warn("[vanguard-draft] DATABASE_URL not set — builds are kept in memory and lost on restart.");
    if (studio.ai.mode === "mock") console.warn("[vanguard-draft] Mock AI mode — set OPENAI_API_KEY (and unset AI_MODE=mock) for real images.");
  });
}

main().catch(error => {
  console.error("[vanguard-draft] failed to start", error);
  process.exit(1);
});
