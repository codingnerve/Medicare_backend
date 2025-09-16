import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "@/models/User";
import { createError } from "@/middleware/errorHandler";
import { logger } from "@/utils/logger";

interface RegisterRequest extends Request {
  body: {
    username: string;
    email: string;
    password: string;
  };
}

interface LoginRequest extends Request {
  body: {
    username: string;
    password: string;
  };
}

export const register = async (
  req: RegisterRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return next(
        createError("User with this username or email already exists", 400)
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: "USER",
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    logger.info(`New user registered: ${username}`);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: LoginRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, password } = req.body;

    // Find user by username or email (include password for validation)
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    }).select("+password");

    if (!user) {
      return next(createError("Invalid credentials", 401));
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(createError("Invalid credentials", 401));
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    logger.info(`User logged in: ${username}`);

    return res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        },
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return next(createError("Refresh token is required", 400));
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refresh_token,
      process.env["JWT_REFRESH_SECRET"]!
    ) as any;

    // Find user
    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(createError("Invalid refresh token", 401));
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    return res.json({
      success: true,
      data: {
        access_token: accessToken,
      },
    });
  } catch (error) {
    next(createError("Invalid refresh token", 401));
  }
};

function generateAccessToken(user: any): string {
  return jwt.sign(
    {
      userId: user._id || user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    process.env["JWT_SECRET"]!,
    { expiresIn: process.env["JWT_EXPIRES_IN"] || "1h" } as jwt.SignOptions
  );
}

function generateRefreshToken(user: any): string {
  return jwt.sign(
    { userId: user._id || user.id },
    process.env["JWT_REFRESH_SECRET"]!,
    {
      expiresIn: process.env["JWT_REFRESH_EXPIRES_IN"] || "7d",
    } as jwt.SignOptions
  );
}
