import { Router } from "express";
import { authenticate, requireAdmin } from "../auth";
import type { AuthRequest } from "../auth";
import { sendWelcomeEmail } from "../mailer";
import {
  listSpacefarers,
  getSpacefarer,
  createSpacefarer,
  updateSpacefarer,
  deleteSpacefarer,
  listDepartments,
  listPositions,
} from "../db";
import type { CreateSpacefarerBody, UpdateSpacefarerBody } from "../types";

const router = Router();
router.use(authenticate);

router.get("/departments", (_req, res) => res.json(listDepartments()));

router.get("/positions", (_req, res) => res.json(listPositions()));

router.get("/spacefarers", (req, res) => {
  const { status, spacesuitColor, sortBy, sortDir, page, pageSize } =
    req.query as Record<string, string>;
  const user = (req as unknown as AuthRequest).user;
  res.json(
    listSpacefarers({
      planet: user.planet,
      status,
      spacesuitColor,
      sortBy,
      sortDir,
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 10,
    }),
  );
});

router.get("/spacefarers/:id", (req, res) => {
  const sf = getSpacefarer(
    req.params.id,
    (req as unknown as AuthRequest).user.planet,
  );
  if (!sf) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(sf);
});

router.post("/spacefarers", requireAdmin, async (req, res) => {
  const data = req.body as CreateSpacefarerBody;
  if (!data.name || !data.email || !data.originPlanet) {
    res
      .status(400)
      .json({ error: "name, email and originPlanet are required" });
    return;
  }
  const skill = Number(data.wormholeNavigationSkill);
  if (
    data.wormholeNavigationSkill !== undefined &&
    (!Number.isInteger(skill) || skill < 1 || skill > 10)
  ) {
    res.status(400).json({
      error: "wormholeNavigationSkill must be an integer between 1 and 10",
    });
    return;
  }
  if (
    data.stardustCollection !== undefined &&
    Number(data.stardustCollection) < 0
  ) {
    res.status(400).json({ error: "stardustCollection cannot be negative" });
    return;
  }
  if (!data.stardustCollection) data.stardustCollection = 100;
  if (!data.wormholeNavigationSkill) data.wormholeNavigationSkill = 5;

  try {
    const created = createSpacefarer(data);
    void sendWelcomeEmail(created);
    res.status(201).json(created);
  } catch (err: unknown) {
    const msg = err as { code?: string; message: string };
    if (msg.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res
        .status(409)
        .json({ error: "A spacefarer with that email already exists" });
      return;
    }
    throw err;
  }
});

router.patch("/spacefarers/:id", requireAdmin, (req, res) => {
  const planet = (req as unknown as AuthRequest).user.planet;
  if (!getSpacefarer(req.params.id, planet)) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const data = req.body as UpdateSpacefarerBody;
  if (data.wormholeNavigationSkill !== undefined) {
    const s = Number(data.wormholeNavigationSkill);
    if (!Number.isInteger(s) || s < 1 || s > 10) {
      res.status(400).json({ error: "wormholeNavigationSkill must be 1–10" });
      return;
    }
  }
  res.json(updateSpacefarer(req.params.id, planet, data));
});

router.delete("/spacefarers/:id", requireAdmin, (req, res) => {
  const ok = deleteSpacefarer(
    req.params.id,
    (req as unknown as AuthRequest).user.planet,
  );
  if (!ok) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).end();
});

router.patch("/spacefarers/:id/retire", requireAdmin, (req, res) => {
  const planet = (req as unknown as AuthRequest).user.planet;
  if (!getSpacefarer(req.params.id, planet)) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(updateSpacefarer(req.params.id, planet, { status: "RETIRED" }));
});

export default router;
