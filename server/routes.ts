import type { Express } from "express";
import { createServer, type Server } from "http";
import fitFilesRouter from "./routes/fit-files";
import cors from "cors";

export function registerRoutes(app: Express): Server {
  // Get allowed origins from environment variable, fallback to development defaults
  // CORS_ALLOWED_ORIGINS should be a comma-separated list of allowed origins
  // Example: 'https://myapp.repl.co,https://custom-domain.com'
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5000', 'http://localhost:3000'];

  console.log('Configured CORS allowed origins:', allowedOrigins);

  // Configure CORS
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('Allowing request with no origin');
        return callback(null, true);
      }

      // In development, allow localhost regardless of port
      if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:')) {
        console.log('Allowing localhost origin in development:', origin);
        return callback(null, true);
      }

      // Allow Replit domains
      if (origin.includes('.replit.app') || origin.includes('.replit.dev') || origin.includes('.repl.co')) {
        console.log('Allowing Replit domain:', origin);
        return callback(null, true);
      }

      if (allowedOrigins.some(allowedOrigin => origin.startsWith(allowedOrigin))) {
        console.log('Allowing matched origin:', origin);
        return callback(null, true);
      }

      console.log('Rejecting unmatched origin:', origin);
      console.log('Allowed origins:', allowedOrigins);

      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    },
    credentials: true, // Allow credentials (cookies, authorization headers)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Register the fit-files routes under /api prefix
  app.use("/api/fit-files", fitFilesRouter);

  const httpServer = createServer(app);

  return httpServer;
}