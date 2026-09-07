import { describe, it, expect, beforeEach, afterEach } from "vitest";
import bcrypt from "bcryptjs";
import os from "os";
import fs from "fs";
import path from "path";

import {
  migrate,
  listSpacefarers,
  getSpacefarer,
  createSpacefarer,
  updateSpacefarer,
  deleteSpacefarer,
  findUserByUsername,
  listDepartments,
  listPositions,
  closeDb,
  setDbPath,
} from "./db";

let tmpDb: string;

beforeEach(() => {
  tmpDb = path.join(
    os.tmpdir(),
    `galactic-test-${Date.now()}-${Math.random()}.db`,
  );
  setDbPath(tmpDb);
  migrate();
});

afterEach(() => {
  closeDb();
  try {
    fs.unlinkSync(tmpDb);
  } catch {}
});

describe("listDepartments", () => {
  it("returns all seeded departments ordered by name", () => {
    const depts = listDepartments();
    expect(depts.length).toBeGreaterThanOrEqual(5);
    expect(depts[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
    });
  });
});

describe("listPositions", () => {
  it("returns all seeded positions ordered by rank", () => {
    const positions = listPositions();
    expect(positions.length).toBeGreaterThanOrEqual(5);
    expect(positions[0].rank).toBeLessThanOrEqual(
      positions[positions.length - 1].rank,
    );
  });
});

describe("findUserByUsername", () => {
  it("returns the user row when found", () => {
    const user = findUserByUsername("alice");
    expect(user).toBeDefined();
    expect(user?.username).toBe("alice");
    expect(user?.planet).toBe("PlanetX");
    expect(user?.role).toBe("admin");
  });

  it("returns undefined for unknown username", () => {
    expect(findUserByUsername("unknown")).toBeUndefined();
  });

  it("stores a bcrypt hash not the plain password", () => {
    const user = findUserByUsername("alice");
    expect(user?.password).not.toBe("alice");
    expect(bcrypt.compareSync("alice", user!.password)).toBe(true);
  });
});

describe("createSpacefarer", () => {
  it("inserts a new spacefarer and returns it with joined data", () => {
    const created = createSpacefarer({
      name: "Zara Nova",
      email: "zara@test.space",
      originPlanet: "PlanetX",
      spacesuitColor: "Cyan",
      stardustCollection: 200,
      wormholeNavigationSkill: 7,
      departmentId: "D1",
    });
    expect(created.id).toBeTruthy();
    expect(created.name).toBe("Zara Nova");
    expect(created.spacesuit_color).toBe("Cyan");
    expect(created.stardust_collection).toBe(200);
    expect(created.status).toBe("CANDIDATE");
    expect(created.department_name).toBe("Stellar Engineering");
  });

  it("applies default values when optional fields are omitted", () => {
    const created = createSpacefarer({
      name: "Min Fields",
      email: "min@test.space",
      originPlanet: "PlanetY",
    });
    expect(created.spacesuit_color).toBe("Silver");
    expect(created.stardust_collection).toBe(100);
    expect(created.wormhole_navigation_skill).toBe(5);
  });
});

describe("getSpacefarer", () => {
  it("returns a spacefarer scoped to the correct planet", () => {
    const sf = getSpacefarer("S1", "PlanetX");
    expect(sf).toBeDefined();
    expect(sf?.name).toBe("Alice Starborn");
  });

  it("returns undefined when planet does not match", () => {
    expect(getSpacefarer("S1", "PlanetY")).toBeUndefined();
  });

  it("returns undefined for a non-existent ID", () => {
    expect(getSpacefarer("DOES-NOT-EXIST", "PlanetX")).toBeUndefined();
  });
});

describe("listSpacefarers", () => {
  it("returns only spacefarers from the requested planet", () => {
    const result = listSpacefarers({ planet: "PlanetX" });
    expect(result.data.every((sf) => sf.origin_planet === "PlanetX")).toBe(
      true,
    );
  });

  it("filters by status", () => {
    const result = listSpacefarers({ planet: "PlanetY", status: "CANDIDATE" });
    expect(result.data.every((sf) => sf.status === "CANDIDATE")).toBe(true);
  });

  it("filters by spacesuitColor", () => {
    const result = listSpacefarers({
      planet: "PlanetX",
      spacesuitColor: "Silver",
    });
    expect(result.data.every((sf) => sf.spacesuit_color === "Silver")).toBe(
      true,
    );
  });

  it("returns correct total count", () => {
    const result = listSpacefarers({ planet: "PlanetX" });
    expect(result.total).toBeGreaterThanOrEqual(result.data.length);
    const all = listSpacefarers({ planet: "PlanetX", pageSize: 100 });
    expect(result.total).toBe(all.data.length);
  });

  it("respects pageSize", () => {
    const result = listSpacefarers({ planet: "PlanetX", pageSize: 1 });
    expect(result.data).toHaveLength(1);
    expect(result.pageSize).toBe(1);
  });

  it("sorts by stardust_collection descending", () => {
    const result = listSpacefarers({
      planet: "PlanetX",
      sortBy: "stardust_collection",
      sortDir: "desc",
    });
    const values = result.data.map((sf) => sf.stardust_collection);
    expect(values).toEqual([...values].sort((a, b) => b - a));
  });
});

describe("updateSpacefarer", () => {
  it("updates allowed fields and returns the updated record", () => {
    const updated = updateSpacefarer("S1", "PlanetX", {
      spacesuitColor: "Gold",
      stardustCollection: 999,
    });
    expect(updated.spacesuit_color).toBe("Gold");
    expect(updated.stardust_collection).toBe(999);
  });

  it("does not change other fields", () => {
    const before = getSpacefarer("S1", "PlanetX")!;
    updateSpacefarer("S1", "PlanetX", { spacesuitColor: "Red" });
    const after = getSpacefarer("S1", "PlanetX")!;
    expect(after.name).toBe(before.name);
    expect(after.origin_planet).toBe(before.origin_planet);
  });

  it("is a no-op when body is empty", () => {
    const before = getSpacefarer("S1", "PlanetX")!;
    const after = updateSpacefarer("S1", "PlanetX", {});
    expect(after.spacesuit_color).toBe(before.spacesuit_color);
  });
});

describe("deleteSpacefarer", () => {
  it("removes the spacefarer and returns true", () => {
    const ok = deleteSpacefarer("S1", "PlanetX");
    expect(ok).toBe(true);
    expect(getSpacefarer("S1", "PlanetX")).toBeUndefined();
  });

  it("returns false when no row matches", () => {
    expect(deleteSpacefarer("GHOST", "PlanetX")).toBe(false);
  });

  it("does not delete a spacefarer belonging to a different planet", () => {
    const ok = deleteSpacefarer("S1", "PlanetY");
    expect(ok).toBe(false);
    expect(getSpacefarer("S1", "PlanetX")).toBeDefined();
  });
});
