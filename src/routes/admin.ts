import express from "express";
import { authenticate } from "../middleware/auth";
import { requireAdmin } from "../middleware/adminAuth";
import {
  getDashboardStats,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getAllDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getAllTests,
  createTest,
  updateTest,
  deleteTest,
  getAllAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  updateAppointmentStatus,
} from "../controllers/adminController";
// Remove import of getAllDoctors from doctorController since we need admin-specific version
// Remove import of getAllTests from testController since we're using adminController version
import {
  validateCreateUser,
  validateCreateDoctor,
  validateCreateTest,
  validateCreateAppointment,
} from "../utils/validation";

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(authenticate);
router.use(requireAdmin);

// Dashboard
router.get("/dashboard", getDashboardStats);

// User Management
router.get("/users", getAllUsers);
router.post("/users", validateCreateUser, createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Doctor Management
router.get("/doctors", getAllDoctors);
router.post("/doctors", validateCreateDoctor, createDoctor);
router.put("/doctors/:id", updateDoctor);
router.delete("/doctors/:id", deleteDoctor);

// Test Management
router.get("/tests", getAllTests);
router.post("/tests", validateCreateTest, createTest);
router.put("/tests/:id", updateTest);
router.delete("/tests/:id", deleteTest);

// Appointment Management
router.get("/appointments", getAllAppointments);
router.post("/appointments", validateCreateAppointment, createAppointment);
router.put("/appointments/:id", validateCreateAppointment, updateAppointment);
router.delete("/appointments/:id", deleteAppointment);
router.put("/appointments/:id/status", updateAppointmentStatus);

export default router;
