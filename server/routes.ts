import type { Express } from "express";
import { createServer, type Server } from "http";
import fitFilesRouter from "./routes/fit-files";

export function registerRoutes(app: Express): Server {
  // Register the fit-files routes under /api prefix
  app.use("/api/fit-files", fitFilesRouter);

  const httpServer = createServer(app);

  return httpServer;
}