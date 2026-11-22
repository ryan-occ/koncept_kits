import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createAccessGate } from "./access-gate";

const config = {
  passcode: "482913",
  sessionSecret: "test-session-secret-with-enough-entropy",
  production: false,
};

function setup(passcode: string | null = config.passcode) {
  const app = express();
  app.set("trust proxy", 1);
  app.use("/api", createAccessGate({ ...config, passcode }).router);
  app.get("/api/private", (_req, res) => res.json({ ok: true }));
  return app;
}

describe("six-digit access gate", () => {
  it("blocks private API requests until a valid code establishes a session", async () => {
    const app = setup();

    expect((await request(app).get("/api/auth/status")).body).toEqual({ enabled: true, authenticated: false });
    expect((await request(app).get("/api/private")).status).toBe(401);
    expect((await request(app).post("/api/auth/login").send({ code: "000000" })).status).toBe(401);

    const login = await request(app).post("/api/auth/login").send({ code: config.passcode });
    expect(login.status).toBe(200);
    expect(login.body).toEqual({ enabled: true, authenticated: true });
    const cookie = login.headers["set-cookie"][0].split(";")[0];
    expect(cookie).toMatch(/^vanguard_access=\d+\.[A-Za-z0-9_-]+$/);

    expect((await request(app).get("/api/private").set("Cookie", cookie)).body).toEqual({ ok: true });
    expect((await request(app).get("/api/auth/status").set("Cookie", cookie)).body).toEqual({ enabled: true, authenticated: true });
  });

  it("limits repeated incorrect codes", async () => {
    const app = setup();
    for (let i = 0; i < 5; i += 1) {
      expect((await request(app).post("/api/auth/login").send({ code: "000000" })).status).toBe(401);
    }

    const limited = await request(app).post("/api/auth/login").send({ code: config.passcode });
    expect(limited.status).toBe(429);
    expect(limited.headers["retry-after"]).toBeTruthy();
  });

  it("requires a passcode in production and validates its format", () => {
    expect(() => createAccessGate({ passcode: null, sessionSecret: config.sessionSecret, production: true }))
      .toThrow("PASSCODE must be set in production");
    expect(() => createAccessGate({ ...config, passcode: "1234" }))
      .toThrow("PASSCODE must contain exactly six digits");
  });

  it("leaves the development app open when no passcode is configured", async () => {
    const app = setup(null);
    expect((await request(app).get("/api/auth/status")).body).toEqual({ enabled: false, authenticated: true });
    expect((await request(app).get("/api/private")).status).toBe(200);
  });
});
