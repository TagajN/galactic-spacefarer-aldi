import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import type { JwtPayload } from "./types";

const SECRET = process.env.JWT_SECRET ?? "galactic-dev-secret";

export function signToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, SECRET, { expiresIn: "8h" });
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers["authorization"] ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Missing token" });
    return;
  }
  try {
    (req as AuthRequest).user = jwt.verify(token, SECRET) as JwtPayload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if ((req as AuthRequest).user?.role !== "admin") {
    res.status(403).json({ error: "Admin role required" });
    return;
  }
  next();
}

export interface AuthRequest extends Request {
  user: JwtPayload;
}
