import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { User } from "@/models/User";
import { createError } from "@/middleware/errorHandler";

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt((req.query as any)["page"] as string) || 1;
    const limit = parseInt((req.query as any)["limit"] as string) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({})
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(),
    ]);

    return res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");

    if (!user) {
      return next(createError("User not found", 404));
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.user!.id).select("-password");

    if (!user) {
      return next(createError("User not found", 404));
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { username, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findById(id);

    if (!existingUser) {
      return next(createError("User not found", 404));
    }

    // Check permissions
    if (req.user!.id !== id && req.user!.role !== "ADMIN") {
      return next(createError("Insufficient permissions", 403));
    }

    // Prepare update data
    const updateData: any = {};

    if (username) {
      // Check if username is already taken
      const usernameExists = await User.findOne({
        username,
        _id: { $ne: id },
      });
      if (usernameExists) {
        return next(createError("Username already taken", 400));
      }
      updateData.username = username;
    }

    if (email) {
      // Check if email is already taken
      const emailExists = await User.findOne({
        email,
        _id: { $ne: id },
      });
      if (emailExists) {
        return next(createError("Email already taken", 400));
      }
      updateData.email = email;
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    if (role && req.user!.role === "ADMIN") {
      updateData.role = role;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    return res.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);

    if (!user) {
      return next(createError("User not found", 404));
    }

    await User.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};
