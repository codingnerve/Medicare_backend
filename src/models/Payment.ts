import mongoose, { Document, Schema } from "mongoose";

export interface IPayment extends Document {
  _id: string;
  userId: string;
  appointmentId: string;
  amount: number;
  currency: string;
  paymentMethod:
    | "credit_card"
    | "debit_card"
    | "net_banking"
    | "upi"
    | "wallet"
    | "razorpay";
  paymentStatus: "pending" | "completed" | "failed" | "refunded";
  transactionId?: string;
  gatewayResponse?: any;
  refundAmount?: number;
  refundReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      ref: "User",
    },
    appointmentId: {
      type: String,
      required: [true, "Appointment ID is required"],
      ref: "Appointment",
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "INR",
      enum: ["INR", "USD", "EUR"],
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      enum: ["credit_card", "debit_card", "net_banking", "upi", "wallet", "razorpay"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    transactionId: {
      type: String,
      trim: true,
    },
    gatewayResponse: {
      type: Schema.Types.Mixed,
    },
    refundAmount: {
      type: Number,
      min: [0, "Refund amount cannot be negative"],
    },
    refundReason: {
      type: String,
      trim: true,
      maxlength: [500, "Refund reason cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
paymentSchema.index({ userId: 1 });
paymentSchema.index({ appointmentId: 1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ createdAt: -1 });

// Transform the output to remove __v and rename _id to id
paymentSchema.set("toJSON", {
  transform: function (_doc, ret) {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

export const Payment = mongoose.model<IPayment>("Payment", paymentSchema);
