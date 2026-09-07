import "dotenv/config";
import express from "express";
import cors from "cors";
import { migrate } from "./db";
import authRoutes from "./routes/authRoutes";
import spacefarerRoutes from "./routes/spacefarerRoutes";

const app = express();
const PORT = parseInt(process.env.PORT ?? "4005", 10);

const CORS_ORIGIN = process.env["CORS_ORIGIN"] ?? "http://localhost:5173";
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api", spacefarerRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

migrate();
app.listen(PORT, () =>
  console.log(`[server] Galactic API → http://localhost:${PORT}`),
);
