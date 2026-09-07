import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import type { Response } from "express";

vi.mock("../db", () => ({
  findUserByUsername: vi.fn(),
}));

import * as db from "../db";
const { default: router } = await import("../routes/authRoutes");

function mockRes() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

function findHandler() {
  const layer = (
    router.stack as Array<{
      route?: { path: string; stack: Array<{ handle: Function }> };
    }>
  ).find((l) => l.route?.path === "/login");
  return layer!.route!.stack[0].handle;
}

const HASHED_USER = {
  id: "U1",
  username: "alice",
  password: bcrypt.hashSync("alice", 10),
  role: "admin" as const,
  planet: "PlanetX",
};

describe("POST /login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when username is missing", async () => {
    const req = { body: { password: "alice" } } as any;
    const res = mockRes();
    await findHandler()(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 when password is missing", async () => {
    const req = { body: { username: "alice" } } as any;
    const res = mockRes();
    await findHandler()(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 401 when user not found", async () => {
    (db.findUserByUsername as any).mockReturnValue(undefined);
    const req = { body: { username: "ghost", password: "ghost" } } as any;
    const res = mockRes();
    await findHandler()(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when password is wrong", async () => {
    (db.findUserByUsername as any).mockReturnValue(HASHED_USER);
    const req = { body: { username: "alice", password: "wrong" } } as any;
    const res = mockRes();
    await findHandler()(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns token and public user on valid credentials", async () => {
    (db.findUserByUsername as any).mockReturnValue(HASHED_USER);
    const req = { body: { username: "alice", password: "alice" } } as any;
    const res = mockRes();
    await findHandler()(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        token: expect.any(String),
        user: expect.objectContaining({
          username: "alice",
          role: "admin",
          planet: "PlanetX",
        }),
      }),
    );
    const payload = (res.json as any).mock.calls[0][0];
    expect(payload.user).not.toHaveProperty("password");
  });
});
