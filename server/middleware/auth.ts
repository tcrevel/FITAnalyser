import { Request, Response, NextFunction } from "express";
import { getAuth } from "firebase-admin/auth";
import { db, testConnection } from "../db";
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

    if (!authHeader) {
      console.log('Auth failed: No authorization header');
      return res.status(401).json({ 
        message: "Authentication required",
        code: 'auth/no-token'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log('Auth failed: Invalid authorization format');
      return res.status(401).json({ 
        message: "Invalid authorization format. Use Bearer token",
        code: 'auth/invalid-format'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      console.log('Auth failed: Empty token');
      return res.status(401).json({ 
        message: "No token provided",
        code: 'auth/empty-token'
      });
    }

    let decodedToken;
    try {
      console.log('Verifying token...');
      decodedToken = await getAuth().verifyIdToken(token);
      console.log('Token verified successfully for user:', decodedToken.uid);
    } catch (verifyError: any) {
      console.error('Token verification failed:', verifyError);
      return res.status(401).json({
        message: verifyError.message || "Invalid authentication token",
        code: verifyError.code || 'auth/invalid-token'
      });
    }

    if (!decodedToken.email) {
      console.log('Auth failed: No email in token');
      return res.status(401).json({ 
        message: "Invalid user token - no email found",
        code: 'auth/no-email'
      });
    }

    // Verify database connection before proceeding
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('Database connection failed');
      return res.status(503).json({ 
        message: "Database connection error",
        code: 'database/connection-error'
      });
    }

    try {
      // Check for existing user by either ID or email
      let user = await db.query.users.findFirst({
        where: or(
          eq(users.id, decodedToken.uid),
          eq(users.email, decodedToken.email)
        )
      });

      // If no user exists, create a new one
      if (!user) {
        console.log('Creating new user for:', decodedToken.email);
        try {
          const [newUser] = await db
            .insert(users)
            .values({
              id: decodedToken.uid,
              email: decodedToken.email,
            })
            .returning();
          user = newUser;
        } catch (dbError: any) {
          console.error('Database error creating user:', dbError);
          return res.status(500).json({ 
            message: "Failed to create user record",
            code: 'auth/db-error'
          });
        }
      } 
      // If user exists but has a different ID (email exists but different provider)
      else if (user.id !== decodedToken.uid) {
        console.log('Updating user ID for:', decodedToken.email);
        try {
          const [updatedUser] = await db
            .update(users)
            .set({ id: decodedToken.uid })
            .where(eq(users.email, decodedToken.email))
            .returning();
          user = updatedUser;
        } catch (dbError: any) {
          console.error('Database error updating user:', dbError);
          return res.status(500).json({ 
            message: "Failed to update user record",
            code: 'auth/db-error'
          });
        }
      }

      req.user = {
        id: user.id,
        email: user.email,
      };

      console.log('Auth successful for user:', user.email);
      next();
    } catch (dbError: any) {
      console.error('Database operation failed:', dbError);
      return res.status(500).json({ 
        message: "Database operation failed",
        code: 'database/operation-error'
      });
    }
  } catch (error: any) {
    console.error("Auth middleware error:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    // Return a generic error if we haven't caught it specifically above
    res.status(401).json({ 
      message: "Authentication failed: " + (error.message || "Unknown error"),
      code: error.code || 'auth/unknown-error'
    });
  }
};