import { Router } from "express";
import { db } from "../db";
import { fitFiles } from "@db/schema";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import type { Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import fs from "fs";

// Define types for authenticated request
interface AuthenticatedRequest extends Request {
  user: {
    id: number;
  };
}

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads", "fit-files");
fs.mkdirSync(uploadsDir, { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ 
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/octet-stream" && path.extname(file.originalname).toLowerCase() === '.fit') {
      cb(null, true);
    } else {
      cb(new Error("Only .fit files are allowed"));
    }
  },
});

// Apply auth middleware to all routes
router.use(requireAuth);

// Get all fit files for the current user
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const files = await db.query.fitFiles.findMany({
      where: eq(fitFiles.userId, req.user.id),
      orderBy: (files, { desc }) => [desc(files.createdAt)],
    });
    res.json(files);
  } catch (error) {
    console.error("Error fetching fit files:", error);
    res.status(500).json({ error: "Failed to fetch fit files" });
  }
});

// Upload a new fit file
router.post("/", upload.single("file"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const newFile = await db.insert(fitFiles).values({
      name: req.body.name || req.file.originalname,
      userId: req.user.id,
      filePath: req.file.path,
    }).returning();

    res.status(201).json(newFile[0]);
  } catch (error) {
    console.error("Error uploading fit file:", error);
    res.status(500).json({ error: "Failed to upload fit file" });
  }
});

// Delete a fit file
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await db.delete(fitFiles)
      .where(eq(fitFiles.id, parseInt(req.params.id)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting fit file:", error);
    res.status(500).json({ error: "Failed to delete fit file" });
  }
});

export default router;