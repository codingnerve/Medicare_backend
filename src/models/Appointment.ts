import mongoose, { Document, Schema } from "mongoose";

export interface IAppointment extends Document {
  _id: string;
  userId: string | mongoose.Types.ObjectId;
  doctorId?: string;
  testId?: string;
  appointmentType: "consultation" | "test";
  appointmentDate: Date;
  appointmentTime: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  patientName?: string;
  symptoms?: string;
  notes?: string;
  totalAmount: number;
  paymentStatus: "pending" | "paid" | "refunded";
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, "User ID is required"],
      ref: "User",
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      validate: {
        validator: function (this: IAppointment) {
          return this.appointmentType === "consultation"
            ? !!this.doctorId
            : true;
        },
        message: "Doctor ID is required for consultation appointments",
      },
    },
    testId: {
      type: Schema.Types.ObjectId,
      ref: "Test",
      validate: {
        validator: function (this: IAppointment) {
          return this.appointmentType === "test" ? !!this.testId : true;
        },
        message: "Test ID is required for test appointments",
      },
    },
    appointmentType: {
      type: String,
      required: [true, "Appointment type is required"],
      enum: ["consultation", "test"],
    },
    appointmentDate: {
      type: Date,
      required: [true, "Appointment date is required"],
      validate: {
        validator: function (value: Date) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return value >= today;
        },
        message: "Appointment date cannot be in the past",
      },
    },
    appointmentTime: {
      type: String,
      required: [true, "Appointment time is required"],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"],
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    patientName: {
      type: String,
      trim: true,
      maxlength: [100, "Patient name cannot exceed 100 characters"],
    },
    symptoms: {
      type: String,
      trim: true,
      maxlength: [1000, "Symptoms cannot exceed 1000 characters"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
appointmentSchema.index({ userId: 1 });
appointmentSchema.index({ doctorId: 1 });
appointmentSchema.index({ testId: 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ paymentStatus: 1 });

// Transform the output to remove __v and rename _id to id
appointmentSchema.set("toJSON", {
  transform: function (_doc, ret) {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

export const Appointment = mongoose.model<IAppointment>(
  "Appointment",
  appointmentSchema
);
