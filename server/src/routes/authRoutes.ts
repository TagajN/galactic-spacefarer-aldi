import { Router } from "express";
import bcrypt from "bcryptjs";
import { findUserByUsername } from "../db";
import { signToken } from "../auth";

const router = Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };
  if (!username || !password) {
    res.status(400).json({ error: "username and password required" });
    return;
  }
  const user = findUserByUsername(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = signToken({
    sub: user.id,
    username: user.username,
    role: user.role,
    planet: user.planet,
  });
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      planet: user.planet,
    },
  });
});

export default router;
