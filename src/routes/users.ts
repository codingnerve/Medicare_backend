import { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getCurrentUser,
} from "@/controllers/userController";

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/users/me - Get current user profile
router.get("/me", getCurrentUser);

// GET /api/users - Get all users (admin only)
router.get("/", authorize("ADMIN"), getAllUsers);

// GET /api/users/:id - Get user by ID
router.get("/:id", getUserById);

// PUT /api/users/:id - Update user
router.put("/:id", updateUser);

// DELETE /api/users/:id - Delete user (admin only)
router.delete("/:id", authorize("ADMIN"), deleteUser);

export default router;
