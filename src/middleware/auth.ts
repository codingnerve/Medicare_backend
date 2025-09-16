import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { createError } from "./errorHandler";

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  console.log("Auth middleware - Headers:", req.headers);
  console.log(
    "Auth middleware - Authorization header:",
    req.headers.authorization
  );

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  console.log(
    "Auth middleware - Extracted token:",
    token ? "Token present" : "No token"
  );

  if (!token) {
    console.log("Auth middleware - No token found, returning 401");
    return next(createError("Access token is required", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env["JWT_SECRET"]!) as any;
    console.log("Auth middleware - Token decoded successfully:", decoded);
    req.user = {
      id: decoded.userId, // Map userId from token to id for consistency
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    console.log("Auth middleware - Token verification failed:", error);
    return next(createError("Invalid or expired token", 401));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError("Authentication required", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(createError("Insufficient permissions", 403));
    }

    next();
  };
};
