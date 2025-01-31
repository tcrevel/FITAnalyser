import { Request, Response, NextFunction } from "express";
import { getAuth } from "firebase-admin/auth";
import { db } from "../db";
import { users } from "@db/schema";
import { eq, or } from "drizzle-orm";

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
      console.log('Auth failed: No bearer token provided');
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('Verifying token...');
    const decodedToken = await getAuth().verifyIdToken(token);
    console.log('Token verified successfully for user:', decodedToken.uid);

    // Check for existing user by either ID or email
    let user = await db.query.users.findFirst({
      where: or(
        eq(users.id, decodedToken.uid),
        eq(users.email, decodedToken.email || '')
      )
    });

    // If no user exists, create a new one
    if (!user) {
      console.log('Creating new user for:', decodedToken.email);
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
      console.log('Updating user ID for:', decodedToken.email);
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

    console.log('Auth successful for user:', user.email);
    next();
  } catch (error: any) {
    console.error("Auth middleware error:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    // Handle specific Firebase Auth errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ message: "Token expired. Please sign in again." });
    }
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ message: "Token has been revoked. Please sign in again." });
    }
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ message: "Invalid token. Please sign in again." });
    }

    res.status(401).json({ 
      message: "Authentication failed",
      error: error.message
    });
  }
};