import Razorpay from "razorpay";
import * as crypto from "crypto";
import { logger } from "./logger";

/** Helper to read env with TS index-signature safe access */
const getEnv = (k: string, fallback?: string) =>
  process.env[k] ?? fallback ?? "";

/** Single Razorpay client init */
const razorpay = new Razorpay({
  key_id: getEnv("RAZORPAY_KEY_ID", "rzp_test_1DP5mmOlF5G5ag"),
  key_secret: getEnv("RAZORPAY_KEY_SECRET", "thisisademokey"),
});

/** Public config (useful in client payloads, signature verify, etc.) */
export const RAZORPAY_CONFIG = {
  key_id: getEnv("RAZORPAY_KEY_ID", "rzp_test_1DP5mmOlF5G5ag"),
  key_secret: getEnv("RAZORPAY_KEY_SECRET", "thisisademokey"),
  currency: "INR",
  company_name: "MediCare Pro",
  company_logo:
    "https://via.placeholder.com/150x50/4F46E5/FFFFFF?text=MediCare+Pro",
};

export default razorpay;

/** Create Razorpay order */
export const createRazorpayOrder = async (
  amount: number,
  currency: string = "INR",
  receipt: string
) => {
  try {
    // Razorpay expects amount in paise (integer)
    const options: {
      amount: number;
      currency: string;
      receipt: string;
      notes?: Record<string, string | number>;
    } = {
      amount: Math.round(amount * 100),
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

/** Verify payment signature */
export const verifyRazorpayPayment = async (
  orderId: string,
  paymentId: string,
  signature: string
) => {
  try {
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

/** Capture payment */
export const captureRazorpayPayment = async (
  paymentId: string,
  amount: number
) => {
  try {
    const capture = await razorpay.payments.capture(
      paymentId,
      Math.round(amount * 100), // paise
      "INR"
    );
    logger.info(`Razorpay payment captured: ${paymentId}`);
    return capture;
  } catch (error) {
    logger.error("Error capturing Razorpay payment:", error);
    throw error;
  }
};

/** Refund payment */
export const refundRazorpayPayment = async (
  paymentId: string,
  amount: number,
  notes?: Record<string, string | number>
) => {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(amount * 100), // paise
      // Razorpay expects a map (IMap<string|number>), not a string
      notes: notes ?? { reason: "Refund for medical appointment" },
    });

    // `refund` is awaited, so .id exists
    logger.info(`Razorpay refund processed: ${refund.id}`);
    return refund;
  } catch (error) {
    logger.error("Error processing Razorpay refund:", error);
    throw error;
  }
};
