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

// Get a single fit file by ID
router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const file = await db.query.fitFiles.findFirst({
      where: eq(fitFiles.id, parseInt(req.params.id)),
    });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Verify the user owns this file
    if (file.userId !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json(file);
  } catch (error) {
    console.error("Error fetching fit file:", error);
    res.status(500).json({ error: "Failed to fetch fit file" });
  }
});

// Upload multiple fit files
router.post("/", upload.array("files"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const names = req.body['names[]'] || [];
    const namesArray = Array.isArray(names) ? names : [names];

    const insertedFiles = await Promise.all(
      req.files.map(async (file, index) => {
        const name = namesArray[index] || file.originalname;
        const [newFile] = await db.insert(fitFiles)
          .values({
            name,
            userId: req.user.id,
            filePath: file.path,
          })
          .returning();
        return newFile;
      })
    );

    res.status(201).json(insertedFiles);
  } catch (error) {
    console.error("Error uploading fit files:", error);
    res.status(500).json({ error: "Failed to upload fit files" });
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