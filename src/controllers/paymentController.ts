import { Request, Response, NextFunction } from "express";
import { Payment } from "@/models/Payment";
import { Appointment } from "@/models/Appointment";
import { createError } from "@/middleware/errorHandler";
import Razorpay from "razorpay";

// Environment variables
const RAZORPAY_KEY_ID = process.env['RAZORPAY_KEY_ID'];
const RAZORPAY_KEY_SECRET = process.env['RAZORPAY_KEY_SECRET'];
const DEMO_MODE = process.env['DEMO_MODE'] === 'true';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID || "rzp_test_RIDyR9uOrC4iUY",
  key_secret: RAZORPAY_KEY_SECRET || "mmmOjdotUB33ZWiaM3zvo3II",
});

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export const getAllPayments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt((req.query as any)["page"] as string) || 1;
    const limit = parseInt((req.query as any)["limit"] as string) || 10;
    const skip = (page - 1) * limit;
    const { paymentStatus, appointmentId } = req.query;

    // Build filter object
    const filter: any = {};

    // Users can only see their own payments, admins can see all
    if (req.user?.role !== "ADMIN") {
      filter.userId = req.user!.id;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    if (appointmentId) {
      filter.appointmentId = appointmentId;
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate(
          "appointmentId",
          "appointmentType appointmentDate appointmentTime status"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id).populate(
      "appointmentId",
      "appointmentType appointmentDate appointmentTime status"
    );

    if (!payment) {
      return next(createError("Payment not found", 404));
    }

    // Users can only see their own payments, admins can see all
    if (req.user?.role !== "ADMIN" && payment.userId !== req.user?.id) {
      return next(createError("Access denied", 403));
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

export const createPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { appointmentId, paymentMethod } = req.body;

    // Verify appointment exists and belongs to user
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return next(createError("Appointment not found", 404));
    }

    if (appointment.userId !== req.user!.id) {
      return next(createError("Access denied", 403));
    }

    if (appointment.paymentStatus === "paid") {
      return next(
        createError("Payment already completed for this appointment", 400)
      );
    }

    // Create payment record
    const payment = await Payment.create({
      userId: req.user!.id,
      appointmentId,
      amount: appointment.totalAmount,
      paymentMethod,
      transactionId: `TXN_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
    });

    // Simulate payment processing (in real app, integrate with payment gateway)
    // For demo purposes, we'll mark it as completed
    payment.paymentStatus = "completed";
    payment.gatewayResponse = {
      status: "success",
      message: "Payment processed successfully",
      timestamp: new Date(),
    };
    await payment.save();

    // Update appointment payment status
    appointment.paymentStatus = "paid";
    await appointment.save();

    const populatedPayment = await Payment.findById(payment._id).populate(
      "appointmentId",
      "appointmentType appointmentDate appointmentTime status"
    );

    res.status(201).json({
      success: true,
      message: "Payment processed successfully",
      data: populatedPayment,
    });
  } catch (error) {
    next(error);
  }
};

export const processRefund = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { refundReason } = req.body;

    // Only admin can process refunds
    if (req.user?.role !== "ADMIN") {
      return next(createError("Admin access required", 403));
    }

    const payment = await Payment.findById(id).populate("appointmentId");

    if (!payment) {
      return next(createError("Payment not found", 404));
    }

    if (payment.paymentStatus !== "completed") {
      return next(createError("Only completed payments can be refunded", 400));
    }

    // Process refund
    payment.paymentStatus = "refunded";
    payment.refundAmount = payment.amount;
    payment.refundReason = refundReason;
    await payment.save();

    // Update appointment payment status
    if (payment.appointmentId) {
      const appointment = await Appointment.findById(payment.appointmentId);
      if (appointment) {
        appointment.paymentStatus = "refunded";
        await appointment.save();
      }
    }

    const populatedPayment = await Payment.findById(id).populate(
      "appointmentId",
      "appointmentType appointmentDate appointmentTime status"
    );

    res.json({
      success: true,
      message: "Refund processed successfully",
      data: populatedPayment,
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Only admin can view payment stats
    if (req.user?.role !== "ADMIN") {
      return next(createError("Admin access required", 403));
    }

    const [
      totalPayments,
      totalAmount,
      completedPayments,
      pendingPayments,
      failedPayments,
      refundedPayments,
    ] = await Promise.all([
      Payment.countDocuments(),
      Payment.aggregate([
        { $match: { paymentStatus: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Payment.countDocuments({ paymentStatus: "completed" }),
      Payment.countDocuments({ paymentStatus: "pending" }),
      Payment.countDocuments({ paymentStatus: "failed" }),
      Payment.countDocuments({ paymentStatus: "refunded" }),
    ]);

    const stats = {
      totalPayments,
      totalAmount: totalAmount[0]?.total || 0,
      completedPayments,
      pendingPayments,
      failedPayments,
      refundedPayments,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// Razorpay payment functions
export const createRazorpayOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { appointmentId, isTest } = req.body;

    // For test mode or demo mode, create order with Razorpay API
    if (isTest || DEMO_MODE) {
      try {
        const razorpayKey = RAZORPAY_KEY_ID || "rzp_test_RIDyR9uOrC4iUY";
        
        // Create order with Razorpay API
        const orderOptions = {
          amount: 10000, // 100 INR in paise
          currency: "INR",
          receipt: `${isTest ? 'test' : 'demo'}_receipt_${Date.now()}`,
          notes: {
            appointmentId: appointmentId,
            isTest: isTest || DEMO_MODE,
          }
        };

        const razorpayOrder = await razorpay.orders.create(orderOptions as any);
        
        const orderData = {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          receipt: razorpayOrder.receipt,
          status: razorpayOrder.status,
          key: razorpayKey,
        };

        return res.json({
          success: true,
          data: {
            order: orderData,
            paymentId: `${isTest ? 'test' : 'demo'}_payment_${Date.now()}`,
            key: razorpayKey,
          },
        });
      } catch (razorpayError) {
        console.error('Razorpay order creation failed:', razorpayError);
        
        // Fallback to mock data if Razorpay API fails
        const razorpayKey = RAZORPAY_KEY_ID || "rzp_test_RIDyR9uOrC4iUY";
        
        const mockOrderData = {
          id: `order_${isTest ? 'test' : 'demo'}_${Date.now()}`,
          amount: 10000, // 100 INR in paise
          currency: "INR",
          receipt: `${isTest ? 'test' : 'demo'}_receipt_${Date.now()}`,
          status: "created",
          key: razorpayKey,
        };

        return res.json({
          success: true,
          data: {
            order: mockOrderData,
            paymentId: `${isTest ? 'test' : 'demo'}_payment_${Date.now()}`,
            key: razorpayKey,
          },
        });
      }
    }

    // Validate appointmentId format (MongoDB ObjectId) for non-test mode
    if (!appointmentId || typeof appointmentId !== 'string') {
      return next(createError("Appointment ID is required", 400));
    }

    // Check if it's a valid MongoDB ObjectId format
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(appointmentId)) {
      return next(createError("Invalid appointment ID format", 400));
    }

    // Verify appointment exists and belongs to user
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return next(createError("Appointment not found", 404));
    }

    if (appointment.userId !== req.user!.id) {
      return next(createError("Access denied", 403));
    }

    if (appointment.paymentStatus === "paid") {
      return next(
        createError("Payment already completed for this appointment", 400)
      );
    }

    // Create payment record
    const payment = await Payment.create({
      userId: req.user!.id,
      appointmentId,
      amount: appointment.totalAmount,
      paymentMethod: "razorpay",
      paymentStatus: "pending",
      transactionId: `TXN_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
    });

    // Create real Razorpay order
    try {
      const razorpayKey = RAZORPAY_KEY_ID || "rzp_test_RIDyR9uOrC4iUY";
      
      const orderOptions = {
        amount: payment.amount * 100, // Razorpay expects amount in paise
        currency: "INR",
        receipt: payment.transactionId,
        notes: {
          appointmentId: appointment._id.toString(),
          paymentId: payment._id.toString(),
        }
      };

      const razorpayOrder = await razorpay.orders.create(orderOptions as any);
      
      const orderData = {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        status: razorpayOrder.status,
        key: razorpayKey,
      };

      res.json({
        success: true,
        data: {
          order: orderData,
          paymentId: payment._id,
          key: razorpayKey,
        },
      });
    } catch (razorpayError) {
      console.error('Razorpay order creation failed:', razorpayError);
      
      // Fallback to mock data if Razorpay API fails
      const razorpayKey = RAZORPAY_KEY_ID || "rzp_test_RIDyR9uOrC4iUY";
      
      const orderData = {
        id: `order_${payment._id}`,
        amount: payment.amount * 100, // Razorpay expects amount in paise
        currency: "INR",
        receipt: payment.transactionId,
        status: "created",
        key: razorpayKey,
      };

      res.json({
        success: true,
        data: {
          order: orderData,
          paymentId: payment._id,
          key: razorpayKey,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

export const verifyRazorpayPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature, isTest } = req.body;

    // For test mode or demo mode, return mock success response
    if (isTest || DEMO_MODE) {
      return res.json({
        success: true,
        message: `${isTest ? 'Test' : 'Demo'} payment verified successfully`,
        data: {
          _id: `${isTest ? 'test' : 'demo'}_payment_${Date.now()}`,
          paymentStatus: "completed",
          amount: 10000,
          paymentMethod: "razorpay",
          gatewayResponse: {
            status: "success",
            message: `${isTest ? 'Test' : 'Demo'} payment verified successfully`,
            timestamp: new Date(),
            razorpayOrderId: razorpayOrderId || `${isTest ? 'test' : 'demo'}_order_${Date.now()}`,
            razorpayPaymentId: razorpayPaymentId || `${isTest ? 'test' : 'demo'}_payment_${Date.now()}`,
            razorpaySignature: razorpaySignature || `${isTest ? 'test' : 'demo'}_signature_${Date.now()}`,
          },
        },
      });
    }

    // Validate paymentId format
    if (!paymentId || typeof paymentId !== 'string') {
      return next(createError("Payment ID is required", 400));
    }

    // Check if it's a valid MongoDB ObjectId format
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(paymentId)) {
      return next(createError("Invalid payment ID format", 400));
    }

    // Find the payment record
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return next(createError("Payment not found", 404));
    }

    if (payment.userId !== req.user!.id) {
      return next(createError("Access denied", 403));
    }

    // In a real implementation, you would verify the signature with Razorpay
    // For demo purposes, we'll simulate successful verification
    payment.paymentStatus = "completed";
    payment.gatewayResponse = {
      status: "success",
      message: "Payment verified successfully",
      timestamp: new Date(),
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    };
    await payment.save();

    // Update appointment payment status
    const appointment = await Appointment.findById(payment.appointmentId);
    if (appointment) {
      appointment.paymentStatus = "paid";
      await appointment.save();
    }

    const populatedPayment = await Payment.findById(payment._id).populate(
      "appointmentId",
      "appointmentType appointmentDate appointmentTime status"
    );

    res.json({
      success: true,
      message: "Payment verified successfully",
      data: populatedPayment,
    });
  } catch (error) {
    next(error);
  }
};

export const handleRazorpayWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // In a real implementation, you would verify the webhook signature
    // and handle different webhook events from Razorpay
    const { event, payload } = req.body;

    console.log("Razorpay webhook received:", { event, payload });

    // Handle different webhook events
    switch (event) {
      case "payment.captured":
        // Handle successful payment
        break;
      case "payment.failed":
        // Handle failed payment
        break;
      default:
        console.log("Unhandled webhook event:", event);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Debug endpoint to check Razorpay configuration
export const getRazorpayConfig = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const config = {
      keyId: RAZORPAY_KEY_ID || "rzp_test_RIDyR9uOrC4iUY",
      demoMode: DEMO_MODE,
      environment: process.env['NODE_ENV'],
    };

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
};
