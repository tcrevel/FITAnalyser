import { Router } from "express";
import { db } from "../db";
import { datasets, fitFiles } from "@db/schema";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import type { Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import fs from "fs";
import { promisify } from "util";

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

// Get all datasets with their fit files
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userDatasets = await db.query.datasets.findMany({
      where: eq(datasets.userId, req.user.id),
      with: {
        fitFiles: true,
      },
      orderBy: (datasets, { desc }) => [desc(datasets.createdAt)],
    });
    res.json(userDatasets);
  } catch (error) {
    console.error("Error fetching datasets:", error);
    res.status(500).json({ error: "Failed to fetch datasets" });
  }
});

// Get a single dataset with its fit files
router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dataset = await db.query.datasets.findFirst({
      where: eq(datasets.id, parseInt(req.params.id)),
      with: {
        fitFiles: true,
      },
    });

    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    if (dataset.userId !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json(dataset);
  } catch (error) {
    console.error("Error fetching dataset:", error);
    res.status(500).json({ error: "Failed to fetch dataset" });
  }
});

// Get the parsed data from a fit file
router.get("/file/:id/data", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const file = await db.query.fitFiles.findFirst({
      where: eq(fitFiles.id, parseInt(req.params.id)),
      with: {
        dataset: true,
      },
    });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    if (file.dataset.userId !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const readFile = promisify(fs.readFile);
    const buffer = await readFile(file.filePath);

    // Dynamically import the fit-file-parser package
    const { default: FitParser } = await import('fit-file-parser');

    const fitParser = new FitParser({
      force: true,
      speedUnit: 'km/h', // Changed from default to ensure consistent units
      lengthUnit: 'km',
      elapsedRecordField: true,
    });

    const parsedData: any = await new Promise((resolve, reject) => {
      fitParser.parse(buffer, (error: Error, data: any) => {
        if (error) {
          console.error("FIT parse error:", error);
          reject(error);
        } else {
          console.log("Successfully parsed FIT data");
          resolve(data);
        }
      });
    });

    const records = parsedData.records || [];
    const processedData = records.map((record: any, index: number) => ({
      index,
      power: record.power || 0,
      cadence: record.cadence || 0,
      heartRate: record.heart_rate || 0,
      // Speed is already in km/h from parser configuration
      speed: record.speed ? Math.min(Math.max(record.speed, 0), 100) : 0,
      // Ensure altitude is in meters and within reasonable range (-500m to 9000m)
      altitude: record.altitude ? Math.min(Math.max(record.altitude, -500), 9000) : 0,
      timestamp: record.timestamp,
    }));

    res.json(processedData);
  } catch (error) {
    console.error("Error parsing fit file:", error);
    res.status(500).json({ error: `Failed to parse fit file: ${error.message}` });
  }
});

// Upload multiple fit files to a new dataset
router.post("/", upload.array("files"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const name = req.body.name || 'New Dataset';

    // Create a new dataset
    const [newDataset] = await db.insert(datasets)
      .values({
        name,
        userId: req.user.id,
      })
      .returning();

    // Add all files to the dataset
    const insertedFiles = await Promise.all(
      (req.files as Express.Multer.File[]).map(async (file, index) => {
        const [newFile] = await db.insert(fitFiles)
          .values({
            name: file.originalname,
            datasetId: newDataset.id,
            filePath: file.path,
          })
          .returning();
        return newFile;
      })
    );

    const dataset = {
      ...newDataset,
      fitFiles: insertedFiles,
    };

    res.status(201).json(dataset);
  } catch (error) {
    console.error("Error uploading fit files:", error);
    res.status(500).json({ error: "Failed to upload fit files" });
  }
});

// Delete a dataset and all its files
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dataset = await db.query.datasets.findFirst({
      where: eq(datasets.id, parseInt(req.params.id)),
      with: {
        fitFiles: true,
      },
    });

    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    if (dataset.userId !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Delete all physical files
    await Promise.all(
      dataset.fitFiles.map(async (file) => {
        try {
          await fs.promises.unlink(file.filePath);
        } catch (error) {
          console.error("Error deleting file from disk:", error);
        }
      })
    );

    // Delete the dataset (this will cascade delete all associated fit files)
    await db.delete(datasets)
      .where(eq(datasets.id, dataset.id));

    res.json({ message: "Dataset deleted successfully" });
  } catch (error) {
    console.error("Error deleting dataset:", error);
    res.status(500).json({ error: "Failed to delete dataset" });
  }
});

export default router;