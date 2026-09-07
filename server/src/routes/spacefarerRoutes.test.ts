import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  type MockedFunction,
} from "vitest";
import type { Response } from "express";
import type { AuthRequest } from "../auth";
import type { Spacefarer } from "../types";

vi.mock("../db", () => ({
  listSpacefarers: vi.fn(),
  getSpacefarer: vi.fn(),
  createSpacefarer: vi.fn(),
  updateSpacefarer: vi.fn(),
  deleteSpacefarer: vi.fn(),
  listDepartments: vi.fn(),
  listPositions: vi.fn(),
}));

vi.mock("../mailer", () => ({ sendWelcomeEmail: vi.fn() }));

vi.mock("../auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../auth")>();
  return {
    ...actual,
    authenticate: vi.fn((_req, _res, next) => next()),
    requireAdmin: vi.fn((_req, _res, next) => next()),
  };
});

import * as db from "../db";
import * as mailer from "../mailer";

const { default: router } = await import("../routes/spacefarerRoutes");

const PLANET = "PlanetX";

function authedReq(overrides: object = {}): AuthRequest {
  return {
    user: { sub: "U1", username: "alice", role: "admin", planet: PLANET },
    params: {},
    query: {},
    body: {},
    headers: {},
    ...overrides,
  } as unknown as AuthRequest;
}

function mockRes() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.end = vi.fn().mockReturnValue(res);
  return res as Response;
}

const FAKE_SF: Spacefarer = {
  id: "S1",
  name: "Alice Starborn",
  email: "alice@galactic.space",
  origin_planet: PLANET,
  spacesuit_color: "Silver",
  stardust_collection: 500,
  wormhole_navigation_skill: 8,
  status: "ACTIVE",
  launch_date: "2024-01-15T09:00:00Z",
  department_id: "D1",
  position_id: "P3",
  created_at: "2024-01-15T09:00:00Z",
  modified_at: "2024-01-15T09:00:00Z",
};

function findHandler(method: string, path: string) {
  const layer = (
    router.stack as Array<{
      route?: {
        path: string;
        methods: Record<string, boolean>;
        stack: Array<{ handle: Function }>;
      };
    }>
  ).find(
    (l) => l.route?.path === path && l.route.methods[method.toLowerCase()],
  );
  if (!layer?.route) throw new Error(`Route ${method} ${path} not found`);
  const handlers = layer.route.stack.map((s) => s.handle);
  return handlers[handlers.length - 1];
}

describe("GET /spacefarers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns paginated list scoped to user planet", async () => {
    (
      db.listSpacefarers as MockedFunction<typeof db.listSpacefarers>
    ).mockReturnValue({ data: [FAKE_SF], total: 1, page: 1, pageSize: 10 });

    const req = authedReq({ query: { page: "1", pageSize: "10" } });
    const res = mockRes();

    const handler = findHandler("get", "/spacefarers");
    await handler(req, res);

    expect(db.listSpacefarers).toHaveBeenCalledWith(
      expect.objectContaining({ planet: PLANET }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ total: 1 }),
    );
  });
});

describe("GET /spacefarers/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 when spacefarer not found", async () => {
    (
      db.getSpacefarer as MockedFunction<typeof db.getSpacefarer>
    ).mockReturnValue(undefined);

    const req = authedReq({ params: { id: "S999" } });
    const res = mockRes();

    const handler = findHandler("get", "/spacefarers/:id");
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns spacefarer when found", async () => {
    (
      db.getSpacefarer as MockedFunction<typeof db.getSpacefarer>
    ).mockReturnValue(FAKE_SF);

    const req = authedReq({ params: { id: "S1" } });
    const res = mockRes();

    const handler = findHandler("get", "/spacefarers/:id");
    await handler(req, res);

    expect(res.json).toHaveBeenCalledWith(FAKE_SF);
  });
});

describe("POST /spacefarers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when wormholeNavigationSkill is out of range", async () => {
    const req = authedReq({
      body: {
        name: "Test",
        email: "t@g.space",
        originPlanet: PLANET,
        wormholeNavigationSkill: 11,
      },
    });
    const res = mockRes();

    const handler = findHandler("post", "/spacefarers");
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(db.createSpacefarer).not.toHaveBeenCalled();
  });

  it("returns 400 when stardustCollection is negative", async () => {
    const req = authedReq({
      body: {
        name: "Test",
        email: "t@g.space",
        originPlanet: PLANET,
        stardustCollection: -1,
      },
    });
    const res = mockRes();

    const handler = findHandler("post", "/spacefarers");
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 when required fields are missing", async () => {
    const req = authedReq({ body: { name: "Test" } });
    const res = mockRes();

    const handler = findHandler("post", "/spacefarers");
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("creates spacefarer with defaults and triggers welcome email", async () => {
    const created = { ...FAKE_SF, id: "S-new" };
    (
      db.createSpacefarer as MockedFunction<typeof db.createSpacefarer>
    ).mockReturnValue(created);

    const req = authedReq({
      body: { name: "Zara Nova", email: "zara@g.space", originPlanet: PLANET },
    });
    const res = mockRes();

    const handler = findHandler("post", "/spacefarers");
    await handler(req, res);

    expect(db.createSpacefarer).toHaveBeenCalledWith(
      expect.objectContaining({
        stardustCollection: 100,
        wormholeNavigationSkill: 5,
      }),
    );
    expect(mailer.sendWelcomeEmail).toHaveBeenCalledWith(created);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe("DELETE /spacefarers/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 when spacefarer does not exist", async () => {
    (
      db.deleteSpacefarer as MockedFunction<typeof db.deleteSpacefarer>
    ).mockReturnValue(false);

    const req = authedReq({ params: { id: "S999" } });
    const res = mockRes();

    const handler = findHandler("delete", "/spacefarers/:id");
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 204 on successful delete", async () => {
    (
      db.deleteSpacefarer as MockedFunction<typeof db.deleteSpacefarer>
    ).mockReturnValue(true);

    const req = authedReq({ params: { id: "S1" } });
    const res = mockRes();

    const handler = findHandler("delete", "/spacefarers/:id");
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
  });
});

describe("PATCH /spacefarers/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 when spacefarer does not exist", async () => {
    (
      db.getSpacefarer as MockedFunction<typeof db.getSpacefarer>
    ).mockReturnValue(undefined);

    const req = authedReq({
      params: { id: "S999" },
      body: { spacesuitColor: "Gold" },
    });
    const res = mockRes();

    const handler = findHandler("patch", "/spacefarers/:id");
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 400 when wormholeNavigationSkill is out of range", async () => {
    (
      db.getSpacefarer as MockedFunction<typeof db.getSpacefarer>
    ).mockReturnValue(FAKE_SF);

    const req = authedReq({
      params: { id: "S1" },
      body: { wormholeNavigationSkill: 0 },
    });
    const res = mockRes();

    const handler = findHandler("patch", "/spacefarers/:id");
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("updates the spacefarer and returns the updated record", async () => {
    const updated = { ...FAKE_SF, spacesuit_color: "Gold" };
    (
      db.getSpacefarer as MockedFunction<typeof db.getSpacefarer>
    ).mockReturnValue(FAKE_SF);
    (
      db.updateSpacefarer as MockedFunction<typeof db.updateSpacefarer>
    ).mockReturnValue(updated);

    const req = authedReq({
      params: { id: "S1" },
      body: { spacesuitColor: "Gold" },
    });
    const res = mockRes();

    const handler = findHandler("patch", "/spacefarers/:id");
    await handler(req, res);

    expect(db.updateSpacefarer).toHaveBeenCalledWith("S1", PLANET, {
      spacesuitColor: "Gold",
    });
    expect(res.json).toHaveBeenCalledWith(updated);
  });
});

describe("PATCH /spacefarers/:id/retire", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 when spacefarer not found", async () => {
    (
      db.getSpacefarer as MockedFunction<typeof db.getSpacefarer>
    ).mockReturnValue(undefined);

    const req = authedReq({ params: { id: "S999" } });
    const res = mockRes();

    const handler = findHandler("patch", "/spacefarers/:id/retire");
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("sets status to RETIRED", async () => {
    const retired = { ...FAKE_SF, status: "RETIRED" as const };
    (
      db.getSpacefarer as MockedFunction<typeof db.getSpacefarer>
    ).mockReturnValue(FAKE_SF);
    (
      db.updateSpacefarer as MockedFunction<typeof db.updateSpacefarer>
    ).mockReturnValue(retired);

    const req = authedReq({ params: { id: "S1" } });
    const res = mockRes();

    const handler = findHandler("patch", "/spacefarers/:id/retire");
    await handler(req, res);

    expect(db.updateSpacefarer).toHaveBeenCalledWith("S1", PLANET, {
      status: "RETIRED",
    });
    expect(res.json).toHaveBeenCalledWith(retired);
  });
});
