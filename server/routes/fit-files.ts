import { Router } from "express";
import { db } from "../db";
import { datasets, fitFiles } from "@db/schema";
import { eq, and } from "drizzle-orm";
import multer from "multer";
import { requireAuth } from "../middleware/auth";
import { uploadFileToStorage, getFileFromStorage } from "../lib/storage";
import type { Request, Response, NextFunction } from "express";
import crypto from 'crypto';

// Define types for authenticated request
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

const router = Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/octet-stream" && file.originalname.toLowerCase().endsWith('.fit')) {
      cb(null, true);
    } else {
      cb(new Error("Only .fit files are allowed"));
    }
  },
});

// Helper function to parse FIT file
async function parseFitFile(buffer: Buffer) {
  try {
    // Import FIT parser dynamically
    const module = await import('fit-file-parser');

    // Get the FitParser constructor
    const FitParser = module.default || module.FitParser;

    if (!FitParser) {
      throw new Error('Failed to load FIT parser module');
    }

    // Create parser instance
    const parser = new FitParser({
      force: true,
      speedUnit: 'km/h',
      lengthUnit: 'km',
      elapsedRecordField: true,
    });

    // Parse the file
    return new Promise((resolve, reject) => {
      parser.parse(buffer, (error: Error | null, data: any) => {
        if (error) {
          console.error('FIT parse error:', error);
          reject(error);
        } else {
          if (!data || !Array.isArray(data.records)) {
            reject(new Error('Invalid FIT file data structure'));
            return;
          }
          resolve(data);
        }
      });
    });
  } catch (error: any) {
    console.error('FIT parser initialization failed:', {
      message: error.message,
      stack: error.stack
    });
    throw new Error(`FIT parser initialization failed: ${error.message}`);
  }
}

// Public endpoints for shared datasets
router.get("/shared/:token", async (req: Request, res: Response) => {
  try {
    const dataset = await db.query.datasets.findFirst({
      where: eq(datasets.shareToken, req.params.token),
      with: {
        fitFiles: true,
      },
    });

    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    const sanitizedDataset = {
      id: dataset.id,
      name: dataset.name,
      createdAt: dataset.createdAt,
      fitFiles: dataset.fitFiles.map(file => ({
        id: file.id,
        name: file.name,
        filePath: file.filePath
      }))
    };

    res.json(sanitizedDataset);
  } catch (error) {
    console.error("Error fetching shared dataset:", error);
    res.status(500).json({ error: "Failed to fetch shared dataset" });
  }
});

router.get("/shared/:token/file/:fileId/data", async (req: Request, res: Response) => {
  try {
    const dataset = await db.query.datasets.findFirst({
      where: eq(datasets.shareToken, req.params.token),
      with: {
        fitFiles: {
          where: eq(fitFiles.id, req.params.fileId)
        },
      },
    });

    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    const file = dataset.fitFiles[0];
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    const buffer = await getFileFromStorage(file.filePath);
    const parsedData = await parseFitFile(buffer);

    if (!parsedData || !parsedData.records) {
      throw new Error("Invalid or empty FIT file data");
    }

    const processedData = parsedData.records.map((record: any, index: number) => ({
      index,
      power: record.power || 0,
      cadence: record.cadence || 0,
      heartRate: record.heart_rate || 0,
      speed: record.speed ? Math.min(Math.max(record.speed, 0), 100) : 0,
      altitude: record.enhanced_altitude 
        ? Math.round(record.enhanced_altitude * 1000)
        : record.altitude
          ? Math.round(record.altitude * 1000) 
          : 0,
      timestamp: record.timestamp,
    }));

    res.json(processedData);
  } catch (error: any) {
    console.error("Error processing shared fit file:", {
      message: error.message,
      stack: error.stack,
      fileId: req.params.fileId
    });
    res.status(500).json({ 
      error: "Failed to process fit file",
      details: error.message
    });
  }
});

// Apply auth middleware to all authenticated routes
router.use(requireAuth);

// Get all datasets with their fit files for the authenticated user
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
      where: and(
        eq(datasets.id, req.params.id),
        eq(datasets.userId, req.user.id)
      ),
      with: {
        fitFiles: true,
      },
    });

    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    res.json(dataset);
  } catch (error) {
    console.error("Error fetching dataset:", error);
    res.status(500).json({ error: "Failed to fetch dataset" });
  }
});

// Get file data
router.get("/file/:id/data", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const file = await db.query.fitFiles.findFirst({
      where: eq(fitFiles.id, req.params.id),
      with: {
        dataset: true,
      },
    });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    if (file.dataset.userId !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized access to file" });
    }

    console.log("Reading file from storage:", file.filePath);
    const buffer = await getFileFromStorage(file.filePath);
    const parsedData = await parseFitFile(buffer);

    if (!parsedData || !parsedData.records) {
      throw new Error("Invalid or empty FIT file data");
    }

    const processedData = parsedData.records.map((record: any, index: number) => ({
      index,
      power: record.power || 0,
      cadence: record.cadence || 0,
      heartRate: record.heart_rate || 0,
      speed: record.speed ? Math.min(Math.max(record.speed, 0), 100) : 0,
      altitude: record.enhanced_altitude 
        ? Math.round(record.enhanced_altitude * 1000)
        : record.altitude
          ? Math.round(record.altitude * 1000) 
          : 0,
      timestamp: record.timestamp,
    }));

    res.json(processedData);
  } catch (error: any) {
    console.error("Error parsing fit file:", {
      message: error.message,
      stack: error.stack,
      fileId: req.params.id
    });
    res.status(500).json({ 
      error: "Failed to parse fit file",
      details: error.message
    });
  }
});

// Upload multiple fit files to a new dataset
router.post("/", upload.array("files"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const name = req.body.name || 'New Dataset';

    const [newDataset] = await db.insert(datasets)
      .values({
        name,
        userId: req.user.id,
      })
      .returning();

    console.log("Created new dataset:", newDataset);

    const insertedFiles = await Promise.all(
      files.map(async (file) => {
        console.log("Processing uploaded file:", {
          originalName: file.originalname,
          size: file.size
        });

        const storagePath = await uploadFileToStorage(file.buffer, file.originalname);

        const [newFile] = await db.insert(fitFiles)
          .values({
            name: file.originalname,
            datasetId: newDataset.id,
            filePath: storagePath,
          })
          .returning();

        return newFile;
      })
    );

    res.status(201).json({
      ...newDataset,
      fitFiles: insertedFiles,
    });
  } catch (error: any) {
    console.error("Error uploading fit files:", {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: "Failed to upload fit files",
      details: error.message
    });
  }
});

// Delete a dataset and all its files
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dataset = await db.query.datasets.findFirst({
      where: and(
        eq(datasets.id, req.params.id),
        eq(datasets.userId, req.user.id)
      ),
      with: {
        fitFiles: true,
      },
    });

    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    await db.delete(datasets)
      .where(eq(datasets.id, dataset.id));

    res.json({ message: "Dataset deleted successfully" });
  } catch (error) {
    console.error("Error deleting dataset:", error);
    res.status(500).json({ error: "Failed to delete dataset" });
  }
});

// Update dataset name
router.patch("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dataset = await db.query.datasets.findFirst({
      where: and(
        eq(datasets.id, req.params.id),
        eq(datasets.userId, req.user.id)
      ),
    });

    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    const [updatedDataset] = await db.update(datasets)
      .set({ name: req.body.name })
      .where(and(
        eq(datasets.id, req.params.id),
        eq(datasets.userId, req.user.id)
      ))
      .returning();

    res.json(updatedDataset);
  } catch (error) {
    console.error("Error updating dataset:", error);
    res.status(500).json({ error: "Failed to update dataset" });
  }
});

// Share a dataset
router.post("/:id/share", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dataset = await db.query.datasets.findFirst({
      where: and(
        eq(datasets.id, req.params.id),
        eq(datasets.userId, req.user.id)
      ),
    });

    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    const shareToken = dataset.shareToken || crypto.randomUUID();

    const [updatedDataset] = await db.update(datasets)
      .set({ shareToken })
      .where(and(
        eq(datasets.id, dataset.id),
        eq(datasets.userId, req.user.id)
      ))
      .returning();

    res.json({ shareToken: updatedDataset.shareToken });
  } catch (error) {
    console.error("Error sharing dataset:", error);
    res.status(500).json({ error: "Failed to share dataset" });
  }
});

export default router;