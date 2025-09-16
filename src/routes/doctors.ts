import { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth";
import {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorSpecializations,
} from "@/controllers/doctorController";

const router = Router();

// Public routes
router.get("/", getAllDoctors);
router.get("/specializations", getDoctorSpecializations);
router.get("/:id", getDoctorById);

// Protected routes (Admin only)
router.use(authenticate);
router.post("/", authorize("ADMIN"), createDoctor);
router.put("/:id", authorize("ADMIN"), updateDoctor);
router.delete("/:id", authorize("ADMIN"), deleteDoctor);

export default router;





