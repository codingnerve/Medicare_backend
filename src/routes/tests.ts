import { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth";
import {
  getAllTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
  getTestCategories,
} from "@/controllers/testController";

const router = Router();

// Public routes
router.get("/", getAllTests);
router.get("/categories", getTestCategories);
router.get("/:id", getTestById);

// Protected routes (Admin only)
router.use(authenticate);
router.post("/", authorize("ADMIN"), createTest);
router.put("/:id", authorize("ADMIN"), updateTest);
router.delete("/:id", authorize("ADMIN"), deleteTest);

export default router;





