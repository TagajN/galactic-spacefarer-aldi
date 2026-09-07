import Database from "better-sqlite3";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import type {
  Spacefarer,
  Department,
  Position,
  User,
  ListQuery,
  ListResult,
  CreateSpacefarerBody,
  UpdateSpacefarerBody,
} from "./types";

let _dbPath: string =
  process.env["DB_PATH_OVERRIDE"] ??
  process.env["DB_PATH"] ??
  path.join(__dirname, "..", "galactic.db");
let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(_dbPath);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
  }
  return _db;
}

// Close and reset the singleton to get a fresh DB each time
export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

// Override the DB path (tests only)
export function setDbPath(p: string): void {
  _dbPath = p;
  _db = null;
}

export function migrate(): void {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id     TEXT PRIMARY KEY,
      name   TEXT NOT NULL,
      galaxy TEXT
    );
    CREATE TABLE IF NOT EXISTS positions (
      id    TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      rank  INTEGER
    );
    CREATE TABLE IF NOT EXISTS spacefarers (
      id                        TEXT PRIMARY KEY,
      name                      TEXT NOT NULL,
      email                     TEXT NOT NULL UNIQUE,
      origin_planet             TEXT NOT NULL,
      spacesuit_color           TEXT    DEFAULT 'Silver',
      stardust_collection       INTEGER DEFAULT 100,
      wormhole_navigation_skill INTEGER DEFAULT 5,
      status                    TEXT    DEFAULT 'CANDIDATE'
                                        CHECK(status IN ('CANDIDATE','ACTIVE','RETIRED')),
      launch_date               TEXT,
      department_id             TEXT REFERENCES departments(id),
      position_id               TEXT REFERENCES positions(id),
      created_at                TEXT DEFAULT (datetime('now')),
      modified_at               TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS users (
      id       TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role     TEXT NOT NULL DEFAULT 'viewer',
      planet   TEXT NOT NULL
    );
  `);
  seed(db);
}

function seed(db: Database.Database): void {
  const depts: Department[] = [
    { id: "D1", name: "Stellar Engineering", galaxy: "Milky Way" },
    { id: "D2", name: "Quantum Navigation", galaxy: "Andromeda" },
    { id: "D3", name: "Cosmic Research", galaxy: "Triangulum" },
    { id: "D4", name: "Wormhole Operations", galaxy: "Large Magellanic Cloud" },
    {
      id: "D5",
      name: "Stardust Collection Bureau",
      galaxy: "Small Magellanic Cloud",
    },
  ];
  const insertDept = db.prepare(
    "INSERT OR IGNORE INTO departments (id,name,galaxy) VALUES (?,?,?)",
  );
  for (const d of depts) insertDept.run(d.id, d.name, d.galaxy);

  const positions: Position[] = [
    { id: "P1", title: "Cadet", rank: 1 },
    { id: "P2", title: "Navigator", rank: 2 },
    { id: "P3", title: "Pilot", rank: 3 },
    { id: "P4", title: "Commander", rank: 4 },
    { id: "P5", title: "Admiral", rank: 5 },
  ];
  const insertPos = db.prepare(
    "INSERT OR IGNORE INTO positions (id,title,rank) VALUES (?,?,?)",
  );
  for (const p of positions) insertPos.run(p.id, p.title, p.rank);

  const seedUsers = [
    {
      id: "U1",
      username: "alice",
      password: "alice",
      role: "admin",
      planet: "PlanetX",
    },
    {
      id: "U2",
      username: "bob",
      password: "bob",
      role: "viewer",
      planet: "PlanetY",
    },
    {
      id: "U3",
      username: "carol",
      password: "carol",
      role: "viewer",
      planet: "PlanetX",
    },
    {
      id: "U4",
      username: "dave",
      password: "dave",
      role: "admin",
      planet: "PlanetY",
    },
  ] as const;
  const insertUser = db.prepare(
    "INSERT OR IGNORE INTO users (id,username,password,role,planet) VALUES (?,?,?,?,?)",
  );
  for (const u of seedUsers)
    insertUser.run(
      u.id,
      u.username,
      bcrypt.hashSync(u.password, 10),
      u.role,
      u.planet,
    );

  const seedSF = [
    {
      id: "S1",
      name: "Alice Starborn",
      email: "alice@galactic.space",
      planet: "PlanetX",
      color: "Silver",
      dust: 500,
      skill: 8,
      status: "ACTIVE",
      dept: "D1",
      pos: "P3",
    },
    {
      id: "S3",
      name: "Carol Quasar",
      email: "carol@galactic.space",
      planet: "PlanetX",
      color: "Blue",
      dust: 750,
      skill: 9,
      status: "ACTIVE",
      dept: "D3",
      pos: "P4",
    },
    {
      id: "S5",
      name: "Eve Cosmos",
      email: "eve@galactic.space",
      planet: "PlanetX",
      color: "Purple",
      dust: 1000,
      skill: 10,
      status: "ACTIVE",
      dept: "D5",
      pos: "P5",
    },
    {
      id: "S6",
      name: "Finn Solaris",
      email: "finn@galactic.space",
      planet: "PlanetX",
      color: "Orange",
      dust: 420,
      skill: 7,
      status: "ACTIVE",
      dept: "D1",
      pos: "P2",
    },
    {
      id: "S7",
      name: "Grace Nebula",
      email: "grace@galactic.space",
      planet: "PlanetX",
      color: "White",
      dust: 200,
      skill: 5,
      status: "CANDIDATE",
      dept: "D2",
      pos: "P1",
    },
    {
      id: "S8",
      name: "Hana Vortex",
      email: "hana@galactic.space",
      planet: "PlanetX",
      color: "Green",
      dust: 680,
      skill: 8,
      status: "ACTIVE",
      dept: "D3",
      pos: "P3",
    },
    {
      id: "S9",
      name: "Ivan Pulsar",
      email: "ivan@galactic.space",
      planet: "PlanetX",
      color: "Black",
      dust: 310,
      skill: 6,
      status: "RETIRED",
      dept: "D4",
      pos: "P2",
    },
    {
      id: "S10",
      name: "Juno Starfall",
      email: "juno@galactic.space",
      planet: "PlanetX",
      color: "Cyan",
      dust: 870,
      skill: 9,
      status: "ACTIVE",
      dept: "D5",
      pos: "P4",
    },
    {
      id: "S11",
      name: "Kai Orion",
      email: "kai@galactic.space",
      planet: "PlanetX",
      color: "Silver",
      dust: 130,
      skill: 3,
      status: "CANDIDATE",
      dept: "D1",
      pos: "P1",
    },
    {
      id: "S12",
      name: "Luna Eclipse",
      email: "luna@galactic.space",
      planet: "PlanetX",
      color: "Gold",
      dust: 560,
      skill: 7,
      status: "ACTIVE",
      dept: "D2",
      pos: "P3",
    },
    {
      id: "S13",
      name: "Mira Andromeda",
      email: "mira@galactic.space",
      planet: "PlanetX",
      color: "Pink",
      dust: 940,
      skill: 9,
      status: "ACTIVE",
      dept: "D3",
      pos: "P5",
    },
    {
      id: "S14",
      name: "Nox Dawnbringer",
      email: "nox@galactic.space",
      planet: "PlanetX",
      color: "Red",
      dust: 275,
      skill: 5,
      status: "CANDIDATE",
      dept: "D4",
      pos: "P1",
    },
    {
      id: "S2",
      name: "Bob Nebula",
      email: "bob@galactic.space",
      planet: "PlanetY",
      color: "Gold",
      dust: 300,
      skill: 6,
      status: "ACTIVE",
      dept: "D2",
      pos: "P2",
    },
    {
      id: "S4",
      name: "Dave Pulsar",
      email: "dave@galactic.space",
      planet: "PlanetY",
      color: "Red",
      dust: 150,
      skill: 4,
      status: "CANDIDATE",
      dept: "D4",
      pos: "P1",
    },
    {
      id: "S15",
      name: "Ora Stardancer",
      email: "ora@galactic.space",
      planet: "PlanetY",
      color: "Violet",
      dust: 620,
      skill: 8,
      status: "ACTIVE",
      dept: "D5",
      pos: "P3",
    },
    {
      id: "S16",
      name: "Penn Solstice",
      email: "penn@galactic.space",
      planet: "PlanetY",
      color: "Teal",
      dust: 455,
      skill: 7,
      status: "ACTIVE",
      dept: "D1",
      pos: "P2",
    },
    {
      id: "S17",
      name: "Quinn Astra",
      email: "quinn@galactic.space",
      planet: "PlanetY",
      color: "Silver",
      dust: 190,
      skill: 4,
      status: "CANDIDATE",
      dept: "D2",
      pos: "P1",
    },
    {
      id: "S18",
      name: "Rex Hyperion",
      email: "rex@galactic.space",
      planet: "PlanetY",
      color: "Orange",
      dust: 810,
      skill: 9,
      status: "ACTIVE",
      dept: "D3",
      pos: "P4",
    },
    {
      id: "S19",
      name: "Sable Vega",
      email: "sable@galactic.space",
      planet: "PlanetY",
      color: "Black",
      dust: 365,
      skill: 6,
      status: "ACTIVE",
      dept: "D4",
      pos: "P2",
    },
    {
      id: "S20",
      name: "Tara Celestia",
      email: "tara@galactic.space",
      planet: "PlanetY",
      color: "White",
      dust: 720,
      skill: 8,
      status: "RETIRED",
      dept: "D5",
      pos: "P3",
    },
    {
      id: "S21",
      name: "Uran Solaris",
      email: "uran@galactic.space",
      planet: "PlanetY",
      color: "Blue",
      dust: 530,
      skill: 7,
      status: "ACTIVE",
      dept: "D1",
      pos: "P3",
    },
    {
      id: "S22",
      name: "Vera Cosmos",
      email: "vera@galactic.space",
      planet: "PlanetY",
      color: "Purple",
      dust: 240,
      skill: 5,
      status: "CANDIDATE",
      dept: "D2",
      pos: "P1",
    },
    {
      id: "S23",
      name: "Wren Nebula",
      email: "wren@galactic.space",
      planet: "PlanetY",
      color: "Green",
      dust: 670,
      skill: 8,
      status: "ACTIVE",
      dept: "D3",
      pos: "P3",
    },
  ];
  const insertSF = db.prepare(`
    INSERT OR IGNORE INTO spacefarers
      (id,name,email,origin_planet,spacesuit_color,stardust_collection,
       wormhole_navigation_skill,status,launch_date,department_id,position_id)
    VALUES (?,?,?,?,?,?,?,?,datetime('now'),?,?)
  `);
  for (const s of seedSF)
    insertSF.run(
      s.id,
      s.name,
      s.email,
      s.planet,
      s.color,
      s.dust,
      s.skill,
      s.status,
      s.dept,
      s.pos,
    );
}

const SELECT_SF = `
  SELECT s.*,
         d.name  AS department_name,
         p.title AS position_title,
         p.rank  AS position_rank
  FROM   spacefarers s
  LEFT JOIN departments d ON d.id = s.department_id
  LEFT JOIN positions   p ON p.id = s.position_id
`;

export function listSpacefarers(q: ListQuery): ListResult<Spacefarer> {
  const db = getDb();
  const conds = ["s.origin_planet = ?"];
  const params: unknown[] = [q.planet];

  if (q.status) {
    conds.push("s.status = ?");
    params.push(q.status);
  }
  if (q.spacesuitColor) {
    conds.push("s.spacesuit_color = ?");
    params.push(q.spacesuitColor);
  }

  const allowed = [
    "name",
    "stardust_collection",
    "wormhole_navigation_skill",
    "launch_date",
    "status",
  ];
  const col = allowed.includes(q.sortBy ?? "") ? `s.${q.sortBy}` : "s.name";
  const dir = q.sortDir === "desc" ? "DESC" : "ASC";
  const page = Math.max(1, q.page ?? 1);
  const size = Math.min(100, q.pageSize ?? 10);
  const offset = (page - 1) * size;
  const where = `WHERE ${conds.join(" AND ")}`;

  const data = db
    .prepare<
      unknown[],
      Spacefarer
    >(`${SELECT_SF} ${where} ORDER BY ${col} ${dir} LIMIT ? OFFSET ?`)
    .all(...params, size, offset);
  const total = (
    db
      .prepare<
        unknown[],
        { c: number }
      >(`SELECT COUNT(*) AS c FROM spacefarers s ${where}`)
      .get(...params) as { c: number }
  ).c;

  return { data, total, page, pageSize: size };
}

export function getSpacefarer(
  id: string,
  planet: string,
): Spacefarer | undefined {
  return getDb()
    .prepare<
      unknown[],
      Spacefarer
    >(`${SELECT_SF} WHERE s.id = ? AND s.origin_planet = ?`)
    .get(id, planet);
}

export function createSpacefarer(data: CreateSpacefarerBody): Spacefarer {
  const db = getDb();
  const id = uuidv4();
  db.prepare(
    `
    INSERT INTO spacefarers
      (id,name,email,origin_planet,spacesuit_color,stardust_collection,
       wormhole_navigation_skill,status,launch_date,department_id,position_id)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `,
  ).run(
    id,
    data.name,
    data.email,
    data.originPlanet,
    data.spacesuitColor ?? "Silver",
    data.stardustCollection ?? 100,
    data.wormholeNavigationSkill ?? 5,
    "CANDIDATE",
    data.launchDate ?? new Date().toISOString(),
    data.departmentId ?? null,
    data.positionId ?? null,
  );
  return getDb()
    .prepare<unknown[], Spacefarer>(`${SELECT_SF} WHERE s.id = ?`)
    .get(id) as Spacefarer;
}

export function updateSpacefarer(
  id: string,
  planet: string,
  data: UpdateSpacefarerBody,
): Spacefarer {
  const db = getDb();
  const colMap: Record<string, string> = {
    name: "name",
    email: "email",
    spacesuitColor: "spacesuit_color",
    stardustCollection: "stardust_collection",
    wormholeNavigationSkill: "wormhole_navigation_skill",
    status: "status",
    launchDate: "launch_date",
    departmentId: "department_id",
    positionId: "position_id",
  };
  const fields: string[] = [];
  const params: unknown[] = [];
  for (const [key, col] of Object.entries(colMap)) {
    const val = (data as Record<string, unknown>)[key];
    if (val !== undefined) {
      fields.push(`${col} = ?`);
      params.push(val);
    }
  }
  if (fields.length) {
    fields.push(`modified_at = datetime('now')`);
    params.push(id, planet);
    db.prepare(
      `UPDATE spacefarers SET ${fields.join(", ")} WHERE id = ? AND origin_planet = ?`,
    ).run(...params);
  }
  return getSpacefarer(id, planet) as Spacefarer;
}

export function deleteSpacefarer(id: string, planet: string): boolean {
  return (
    getDb()
      .prepare("DELETE FROM spacefarers WHERE id = ? AND origin_planet = ?")
      .run(id, planet).changes > 0
  );
}

export function findUserByUsername(username: string): User | undefined {
  return getDb()
    .prepare<unknown[], User>("SELECT * FROM users WHERE username = ?")
    .get(username);
}

export function listDepartments(): Department[] {
  return getDb()
    .prepare<[], Department>("SELECT * FROM departments ORDER BY name")
    .all();
}

export function listPositions(): Position[] {
  return getDb()
    .prepare<[], Position>("SELECT * FROM positions ORDER BY rank")
    .all();
}
