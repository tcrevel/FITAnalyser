import { Request, Response, NextFunction } from "express";
import { getAuth } from "firebase-admin/auth";
import { db } from "../db";
import { users } from "@db/schema";
import { eq, or } from "drizzle-orm";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;  // Firebase UID
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
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);

    // Check for existing user by either ID or email
    let user = await db.query.users.findFirst({
      where: or(
        eq(users.id, decodedToken.uid),
        eq(users.email, decodedToken.email || '')
      )
    });

    // If no user exists, create a new one
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
    // If user exists but has a different ID (email exists but different provider)
    else if (user.id !== decodedToken.uid) {
      // Update the user's ID to match the Firebase UID
      const [updatedUser] = await db
        .update(users)
        .set({
          id: decodedToken.uid,
        })
        .where(eq(users.email, decodedToken.email || ''))
        .returning();
      user = updatedUser;
    }

    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Unauthorized" });
  }
};