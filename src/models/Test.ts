import mongoose, { Document, Schema } from "mongoose";

export interface ITest extends Document {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  duration: number; // in minutes
  preparationInstructions?: string;
  normalRange?: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const testSchema = new Schema<ITest>(
  {
    name: {
      type: String,
      required: [true, "Test name is required"],
      trim: true,
      maxlength: [100, "Test name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Test description is required"],
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    category: {
      type: String,
      required: [true, "Test category is required"],
      trim: true,
      enum: [
        "Blood Test",
        "Urine Test",
        "Imaging",
        "Cardiology",
        "Neurology",
        "Dermatology",
        "Gynecology",
        "Pediatrics",
        "General",
        "Other",
      ],
    },
    price: {
      type: Number,
      required: [true, "Test price is required"],
      min: [0, "Price cannot be negative"],
    },
    duration: {
      type: Number,
      required: [true, "Test duration is required"],
      min: [5, "Duration must be at least 5 minutes"],
      max: [480, "Duration cannot exceed 8 hours"],
    },
    preparationInstructions: {
      type: String,
      trim: true,
      maxlength: [
        1000,
        "Preparation instructions cannot exceed 1000 characters",
      ],
    },
    normalRange: {
      type: String,
      trim: true,
      maxlength: [200, "Normal range cannot exceed 200 characters"],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
testSchema.index({ category: 1 });
testSchema.index({ price: 1 });
testSchema.index({ isAvailable: 1 });
testSchema.index({ name: "text", description: "text" });

// Transform the output to remove __v and rename _id to id
testSchema.set("toJSON", {
  transform: function (_doc, ret) {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

export const Test = mongoose.model<ITest>("Test", testSchema);
