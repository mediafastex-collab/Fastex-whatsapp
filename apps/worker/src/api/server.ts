import express from "express";
import cors from "cors";
import { router as apiRoutes } from "./routes";
import { config } from "../config/env";

export function createServer(): express.Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health endpoint without auth for Docker container health check
  app.get("/health", (req, res) => {
    res.json({ status: "OK", port: config.port });
  });

  app.use("/api/internal/whatsapp", apiRoutes);

  return app;
}
