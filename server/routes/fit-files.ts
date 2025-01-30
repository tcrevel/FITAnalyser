import { Router } from "express";
import { db } from "../db";
import { datasets, fitFiles } from "@db/schema";
import { eq, and } from "drizzle-orm";
import multer from "multer";
import path from "path";
import type { Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import fs from "fs";
import { promisify } from "util";
import crypto from 'crypto';

// Define types for authenticated request
interface AuthenticatedRequest extends Request {
  user: {
    id: string;  // Firebase UID
    email: string;
  };
}

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads", "fit-files");
fs.mkdirSync(uploadsDir, { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
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

    // Don't expose sensitive data in shared view
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

    const readFile = promisify(fs.readFile);
    const buffer = await readFile(file.filePath);
    const { default: FitParserModule } = await import('fit-file-parser');

    const fitParser = new FitParserModule({
      force: true,
      speedUnit: 'km/h',
      lengthUnit: 'km',
      elapsedRecordField: true,
    });

    const parsedData: any = await new Promise((resolve, reject) => {
      fitParser.parse(buffer, (error: Error, data: any) => {
        if (error) {
          console.error("FIT parse error:", error);
          reject(error);
        } else {
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
    console.error("Error parsing shared fit file:", error);
    res.status(500).json({ error: `Failed to parse fit file: ${error.message}` });
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

// Get a single dataset with its fit files for the authenticated user
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

// Get the parsed data from a fit file for the authenticated user
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

    // Check if the file's dataset belongs to the authenticated user
    if (file.dataset.userId !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized access to file" });
    }

    console.log("Reading file from path:", file.filePath); // Debug log
    const readFile = promisify(fs.readFile);
    const buffer = await readFile(file.filePath);
    const { default: FitParserModule } = await import('fit-file-parser');

    const fitParser = new FitParserModule({
      force: true,
      speedUnit: 'km/h',
      lengthUnit: 'km',
      elapsedRecordField: true,
    });

    const parsedData: any = await new Promise((resolve, reject) => {
      fitParser.parse(buffer, (error: Error, data: any) => {
        if (error) {
          console.error("FIT parse error:", error);
          reject(error);
        } else {
          console.log("FIT file parsed successfully, records:", data.records?.length); // Debug log
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
      error: error.message,
      stack: error.stack,
      fileId: req.params.id
    });

    // Send a more detailed error response
    res.status(500).json({ 
      error: `Failed to parse fit file: ${error.message}`,
      details: error.stack
    });
  }
});

// Upload multiple fit files to a new dataset for the authenticated user
router.post("/", upload.array("files"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const name = req.body.name || 'New Dataset';

    // Ensure uploads directory exists
    await fs.promises.mkdir(uploadsDir, { recursive: true });
    console.log("Upload directory created/verified:", uploadsDir); // Debug log

    // Create a new dataset with the authenticated user's ID
    const [newDataset] = await db.insert(datasets)
      .values({
        name,
        userId: req.user.id,
      })
      .returning();

    console.log("Created new dataset:", newDataset); // Debug log

    // Add all files to the dataset
    const insertedFiles = await Promise.all(
      (req.files as Express.Multer.File[]).map(async (file) => {
        console.log("Processing uploaded file:", {  // Debug log
          originalName: file.originalname,
          path: file.path,
          size: file.size
        });

        const [newFile] = await db.insert(fitFiles)
          .values({
            name: file.originalname,
            datasetId: newDataset.id,
            filePath: file.path,
          })
          .returning();

        // Verify file exists after upload
        try {
          await fs.promises.access(file.path);
          console.log("File successfully saved:", file.path); // Debug log
        } catch (error) {
          console.error("File not found after upload:", file.path); // Debug log
          throw new Error(`File not found after upload: ${file.path}`);
        }

        return newFile;
      })
    );

    res.status(201).json({
      ...newDataset,
      fitFiles: insertedFiles,
    });
  } catch (error) {
    console.error("Error uploading fit files:", error);
    res.status(500).json({ error: "Failed to upload fit files" });
  }
});

// Delete a dataset and all its files for the authenticated user
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

    // Delete the dataset (cascade will delete associated fit files)
    await db.delete(datasets)
      .where(eq(datasets.id, dataset.id));

    res.json({ message: "Dataset deleted successfully" });
  } catch (error) {
    console.error("Error deleting dataset:", error);
    res.status(500).json({ error: "Failed to delete dataset" });
  }
});

// Update dataset name for the authenticated user
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

// Share a dataset for the authenticated user
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

// Delete a single file from a dataset for the authenticated user
router.delete("/:datasetId/file/:fileId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const file = await db.query.fitFiles.findFirst({
      where: eq(fitFiles.id, req.params.fileId),
      with: {
        dataset: true,
      },
    });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Check if the file's dataset belongs to the authenticated user
    if (file.dataset.userId !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized deletion attempt" });
    }

    // Delete the physical file
    try {
      await fs.promises.unlink(file.filePath);
    } catch (error) {
      console.error("Error deleting file from disk:", error);
    }

    // Delete the file record from database
    await db.delete(fitFiles)
      .where(eq(fitFiles.id, file.id));

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

export default router;