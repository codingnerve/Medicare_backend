import Razorpay from "razorpay";
import { logger } from "./logger";

// Razorpay configuration with demo/test API keys
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_1DP5mmOlF5G5ag", // Demo key
  key_secret: process.env.RAZORPAY_KEY_SECRET || "thisisademokey", // Demo secret
});

// Razorpay demo/test configuration
export const RAZORPAY_CONFIG = {
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_1DP5mmOlF5G5ag",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "thisisademokey",
  currency: "INR",
  company_name: "MediCare Pro",
  company_logo: "https://via.placeholder.com/150x50/4F46E5/FFFFFF?text=MediCare+Pro",
};

export default razorpay;

// Helper function to create Razorpay order
export const createRazorpayOrder = async (amount: number, currency: string = "INR", receipt: string) => {
  try {
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt,
      notes: {
        payment_for: "Medical Appointment",
        company: "MediCare Pro",
      },
    };

    const order = await razorpay.orders.create(options);
    logger.info(`Razorpay order created: ${order.id}`);
    return order;
  } catch (error) {
    logger.error("Error creating Razorpay order:", error);
    throw error;
  }
};

// Helper function to verify Razorpay payment
export const verifyRazorpayPayment = async (orderId: string, paymentId: string, signature: string) => {
  try {
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_CONFIG.key_secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const isValid = expectedSignature === signature;
    
    if (isValid) {
      logger.info(`Razorpay payment verified: ${paymentId}`);
      return { success: true, paymentId };
    } else {
      logger.warn(`Razorpay payment verification failed: ${paymentId}`);
      return { success: false, error: "Invalid signature" };
    }
  } catch (error) {
    logger.error("Error verifying Razorpay payment:", error);
    throw error;
  }
};

// Helper function to capture Razorpay payment
export const captureRazorpayPayment = async (paymentId: string, amount: number) => {
  try {
    const capture = await razorpay.payments.capture(paymentId, amount * 100, "INR");
    logger.info(`Razorpay payment captured: ${paymentId}`);
    return capture;
  } catch (error) {
    logger.error("Error capturing Razorpay payment:", error);
    throw error;
  }
};

// Helper function to refund Razorpay payment
export const refundRazorpayPayment = async (paymentId: string, amount: number, notes?: string) => {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount * 100, // Amount in paise
      notes: notes || "Refund for medical appointment",
    });
    logger.info(`Razorpay refund processed: ${refund.id}`);
    return refund;
  } catch (error) {
    logger.error("Error processing Razorpay refund:", error);
    throw error;
  }
};

