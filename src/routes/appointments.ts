import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  cancelAppointment,
} from "@/controllers/appointmentController";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Appointment routes
router.get("/", getAllAppointments);
router.get("/:id", getAppointmentById);
router.post("/", createAppointment);
router.put("/:id", updateAppointment);
router.delete("/:id", deleteAppointment);
router.patch("/:id/cancel", cancelAppointment);

export default router;





