import { Request, Response, NextFunction } from "express";
import { Appointment } from "@/models/Appointment";
import { Doctor } from "@/models/Doctor";
import { Test } from "@/models/Test";
import { createError } from "@/middleware/errorHandler";

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export const getAllAppointments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt((req.query as any)["page"] as string) || 1;
    const limit = parseInt((req.query as any)["limit"] as string) || 10;
    const skip = (page - 1) * limit;
    const { status, appointmentType, doctorId } = req.query;

    // Build filter object
    const filter: any = {};

    // Users can only see their own appointments, admins can see all
    if (req.user?.role !== "ADMIN") {
      filter.userId = req.user!.id;
    }

    if (status) {
      filter.status = status;
    }

    if (appointmentType) {
      filter.appointmentType = appointmentType;
    }

    if (doctorId) {
      filter.doctorId = doctorId;
    }

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate("doctorId", "name specialization consultationFee")
        .populate("testId", "name price duration")
        .sort({ appointmentDate: -1 })
        .skip(skip)
        .limit(limit),
      Appointment.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: appointments,
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

export const getAppointmentById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id)
      .populate("doctorId", "name specialization consultationFee")
      .populate("testId", "name price duration");

    if (!appointment) {
      return next(createError("Appointment not found", 404));
    }

    // Users can only see their own appointments, admins can see all
    if (req.user?.role !== "ADMIN" && appointment.userId !== req.user?.id) {
      return next(createError("Access denied", 403));
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAppointment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find the appointment first
    const existingAppointment = await Appointment.findById(id);

    if (!existingAppointment) {
      return next(createError("Appointment not found", 404));
    }

    // Users can only update their own appointments, admins can update any
    if (
      req.user?.role !== "ADMIN" &&
      existingAppointment.userId !== req.user?.id
    ) {
      return next(createError("Access denied", 403));
    }

    // Prevent updating certain fields for non-admin users
    if (req.user?.role !== "ADMIN") {
      delete updateData.status;
      delete updateData.paymentStatus;
    }

    const appointment = await Appointment.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("doctorId", "name specialization consultationFee")
      .populate("testId", "name price duration");

    res.json({
      success: true,
      message: "Appointment updated successfully",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAppointment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return next(createError("Appointment not found", 404));
    }

    // Users can only delete their own appointments, admins can delete any
    if (req.user?.role !== "ADMIN" && appointment.userId !== req.user?.id) {
      return next(createError("Access denied", 403));
    }

    await Appointment.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const cancelAppointment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return next(createError("Appointment not found", 404));
    }

    // Users can only cancel their own appointments, admins can cancel any
    if (req.user?.role !== "ADMIN" && appointment.userId !== req.user?.id) {
      return next(createError("Access denied", 403));
    }

    if (appointment.status === "completed") {
      return next(createError("Cannot cancel a completed appointment", 400));
    }

    appointment.status = "cancelled";
    await appointment.save();

    const populatedAppointment = await Appointment.findById(id)
      .populate("doctorId", "name specialization consultationFee")
      .populate("testId", "name price duration");

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
      data: populatedAppointment,
    });
  } catch (error) {
    next(error);
  }
};

export const createAppointment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("Creating appointment with user:", req.user);
    console.log("User ID from token:", req.user?.id);
    console.log("User ID type:", typeof req.user?.id);
    console.log("Request body:", req.body);

    const {
      appointmentType,
      appointmentDate,
      appointmentTime,
      symptoms,
      notes,
      doctorId,
      testId,
    } = req.body;

    if (!appointmentType || !appointmentDate || !appointmentTime) {
      return next(
        createError("Appointment type, date, and time are required", 400)
      );
    }

    if (appointmentType === "consultation" && !doctorId) {
      return next(
        createError("Doctor ID is required for consultation appointments", 400)
      );
    }

    if (appointmentType === "test" && !testId) {
      return next(
        createError("Test ID is required for test appointments", 400)
      );
    }

    // Verify doctor exists and get consultation fee
    let totalAmount = 0;
    if (appointmentType === "consultation" && doctorId) {
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return next(createError("Doctor not found", 404));
      }
      totalAmount = doctor.consultationFee;
    }

    // Verify test exists and get price
    if (appointmentType === "test" && testId) {
      const test = await Test.findById(testId);
      if (!test) {
        return next(createError("Test not found", 404));
      }
      totalAmount = test.price;
    }

    // Check for conflicting appointments
    const conflictingAppointment = await Appointment.findOne({
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: { $in: ["confirmed", "pending"] },
      ...(doctorId && { doctorId }),
    });

    if (conflictingAppointment) {
      return next(createError("Time slot is already booked", 400));
    }

    const appointmentData = {
      userId: req.user!.id, // This should now be properly mapped from the JWT token
      appointmentType,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      symptoms,
      notes,
      doctorId: appointmentType === "consultation" ? doctorId : undefined,
      testId: appointmentType === "test" ? testId : undefined,
      status: "pending",
      totalAmount,
      paymentStatus: "pending",
    };

    console.log("Creating appointment with data:", appointmentData);
    console.log("Total amount type:", typeof appointmentData.totalAmount);
    console.log("Total amount value:", appointmentData.totalAmount);

    const appointment = new Appointment(appointmentData);

    try {
      await appointment.save();
      console.log("Appointment saved successfully:", appointment._id);
    } catch (saveError: any) {
      console.error("Appointment save error:", saveError);
      if (saveError.name === "ValidationError") {
        console.error("Validation errors:", saveError.errors);
        return next(
          createError(
            `Validation failed: ${Object.values(saveError.errors)
              .map((err: any) => err.message)
              .join(", ")}`,
            400
          )
        );
      }
      throw saveError;
    }

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("doctorId", "name specialization consultationFee")
      .populate("testId", "name price duration");

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: populatedAppointment,
    });
  } catch (error) {
    next(error);
  }
};
