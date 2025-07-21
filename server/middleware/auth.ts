import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    isOwner: boolean;
    isActive: boolean;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    const sessionToken = req.headers["x-session-token"] as string;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : sessionToken;

    if (!token) {
      return res.status(401).json({
        error: "Authentication required",
        message: "No authentication token provided",
      });
    }

    // Validate the session token
    const validation = await authService.validateSession(token);

    if (!validation.valid || !validation.user) {
      return res.status(401).json({
        error: "Invalid authentication",
        message: "Authentication token is invalid or expired",
      });
    }

    // Check if user is active
    if (!validation.user.isActive) {
      return res.status(403).json({
        error: "Account suspended",
        message: "Your account has been deactivated",
      });
    }

    // Attach user info to request
    req.user = {
      id: validation.user.id,
      email: validation.user.email,
      username: validation.user.username,
      isOwner: validation.user.isOwner,
      isActive: validation.user.isActive,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      error: "Authentication error",
      message: "Internal server error during authentication",
    });
  }
};

export const ownerOnlyMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
      message: "No user information found in request",
    });
  }

  if (!req.user.isOwner) {
    return res.status(403).json({
      error: "Access denied",
      message: "Owner privileges required for this operation",
    });
  }

  next();
};

export const adminOnlyMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
      message: "No user information found in request",
    });
  }

  // For now, only owner has admin privileges
  // In the future, you could add an isAdmin field
  if (!req.user.isOwner) {
    return res.status(403).json({
      error: "Access denied",
      message: "Administrator privileges required for this operation",
    });
  }

  next();
};

export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    const sessionToken = req.headers["x-session-token"] as string;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : sessionToken;

    if (token) {
      const validation = await authService.validateSession(token);

      if (validation.valid && validation.user && validation.user.isActive) {
        req.user = {
          id: validation.user.id,
          email: validation.user.email,
          username: validation.user.username,
          isOwner: validation.user.isOwner,
          isActive: validation.user.isActive,
        };
      }
    }

    // Continue regardless of authentication status
    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    // Continue without authentication
    next();
  }
};

export const rateLimitByUser = (
  maxRequests: number = 100,
  windowMs: number = 60000,
) => {
  const userRequestCounts = new Map<
    string,
    { count: number; resetTime: number }
  >();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id || req.ip || "anonymous";
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;

    const current = userRequestCounts.get(userId);

    if (!current || current.resetTime !== windowStart) {
      userRequestCounts.set(userId, { count: 1, resetTime: windowStart });
      res.set("X-RateLimit-Limit", maxRequests.toString());
      res.set("X-RateLimit-Remaining", (maxRequests - 1).toString());
      res.set(
        "X-RateLimit-Reset",
        new Date(windowStart + windowMs).toISOString(),
      );
      return next();
    }

    current.count++;

    if (current.count > maxRequests) {
      res.set("X-RateLimit-Limit", maxRequests.toString());
      res.set("X-RateLimit-Remaining", "0");
      res.set(
        "X-RateLimit-Reset",
        new Date(windowStart + windowMs).toISOString(),
      );

      return res.status(429).json({
        error: "Rate limit exceeded",
        message: `Too many requests. Limit: ${maxRequests} per ${windowMs / 1000} seconds`,
        retryAfter: Math.ceil((windowStart + windowMs - now) / 1000),
      });
    }

    res.set("X-RateLimit-Limit", maxRequests.toString());
    res.set("X-RateLimit-Remaining", (maxRequests - current.count).toString());
    res.set(
      "X-RateLimit-Reset",
      new Date(windowStart + windowMs).toISOString(),
    );

    next();
  };
};

export const requireEmailVerification = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  // In a real implementation, you'd check if the user's email is verified
  // For now, we'll assume all users are verified
  // if (!req.user.emailVerified) {
  //   return res.status(403).json({
  //     error: "Email verification required",
  //     message: "Please verify your email address to access this feature",
  //   });
  // }

  next();
};

export const corsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Handle CORS for specific origins
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://chatkingai.com",
    "https://www.chatkingai.com",
  ];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Session-Token",
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  next();
};
