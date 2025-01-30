import { Request, Response, NextFunction } from "express";
import { getAuth } from "firebase-admin/auth";
import { db } from "../db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);

    // Get or create user in our database
    let user = await db.query.users.findFirst({
      where: eq(users.id, decodedToken.uid)
    });

    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({
          id: decodedToken.uid,
          email: decodedToken.email || '',
        })
        .returning();
      user = newUser;
    }

    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};