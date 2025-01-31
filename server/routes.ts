import type { Express } from "express";
import { createServer, type Server } from "http";
import fitFilesRouter from "./routes/fit-files";
import cors from "cors";

export function registerRoutes(app: Express): Server {
  // Configure CORS
  app.use(cors({
    origin: true, // Automatically handle origin based on request
    credentials: true, // Allow credentials (cookies, authorization headers)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Register the fit-files routes under /api prefix
  app.use("/api/fit-files", fitFilesRouter);

  const httpServer = createServer(app);

  return httpServer;
}