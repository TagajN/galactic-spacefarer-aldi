import { describe, it, expect, vi } from "vitest";
import { signToken, authenticate, requireAdmin } from "./auth";
import type { AuthRequest } from "./auth";
import type { Response, NextFunction } from "express";

function mockRes() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

function mockNext(): NextFunction {
  return vi.fn() as unknown as NextFunction;
}

describe("signToken", () => {
  it("returns a non-empty JWT string", () => {
    const token = signToken({
      sub: "U1",
      username: "alice",
      role: "admin",
      planet: "PlanetX",
    });
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("embeds the expected claims", () => {
    const payload = {
      sub: "U2",
      username: "bob",
      role: "viewer" as const,
      planet: "PlanetY",
    };
    const token = signToken(payload);
    const decoded = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString(),
    );
    expect(decoded.username).toBe("bob");
    expect(decoded.planet).toBe("PlanetY");
    expect(decoded.role).toBe("viewer");
  });
});

describe("authenticate", () => {
  it("calls next() and attaches user when token is valid", () => {
    const token = signToken({
      sub: "U1",
      username: "alice",
      role: "admin",
      planet: "PlanetX",
    });
    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as AuthRequest;
    const res = mockRes();
    const next = mockNext();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user.username).toBe("alice");
    expect(req.user.planet).toBe("PlanetX");
  });

  it("returns 401 when no token is provided", () => {
    const req = { headers: {} } as AuthRequest;
    const res = mockRes();
    const next = mockNext();

    authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when token is malformed", () => {
    const req = {
      headers: { authorization: "Bearer not.a.token" },
    } as AuthRequest;
    const res = mockRes();
    const next = mockNext();

    authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe("requireAdmin", () => {
  it("calls next() for admin users", () => {
    const req = { user: { role: "admin" } } as AuthRequest;
    const res = mockRes();
    const next = mockNext();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("returns 403 for viewer users", () => {
    const req = { user: { role: "viewer" } } as AuthRequest;
    const res = mockRes();
    const next = mockNext();

    requireAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
