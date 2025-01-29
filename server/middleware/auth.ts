import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users } from "@db/schema";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

// Temporary development middleware that assigns a default user
// TODO: Replace with proper authentication
export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // For development, create or get the first user
    let user = await db.query.users.findFirst();
    
    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({
          username: "demo_user",
          password: "demo_password", // In production, this should be hashed
        })
        .returning();
      user = newUser;
    }
    
    req.user = {
      id: user.id,
      username: user.username,
    };
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};
