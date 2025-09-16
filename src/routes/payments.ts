import { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth";
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
  processRefund,
  getPaymentStats,
  getRazorpayConfig,
} from "@/controllers/paymentController";

const router = Router();

// Payment routes
router.get("/", authenticate, getAllPayments);
router.get("/stats", authenticate, authorize("ADMIN"), getPaymentStats);
router.get("/:id", authenticate, getPaymentById);
router.post("/", authenticate, createPayment);

// Razorpay payment routes
router.get("/razorpay/config", getRazorpayConfig); // Debug endpoint - no auth needed
router.post("/razorpay/order", authenticate, createRazorpayOrder);
router.post("/razorpay/verify", authenticate, verifyRazorpayPayment);
router.post("/razorpay/webhook", handleRazorpayWebhook); // No auth for webhooks

router.patch("/:id/refund", authenticate, authorize("ADMIN"), processRefund);

export default router;





