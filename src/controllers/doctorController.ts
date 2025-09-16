import { Request, Response, NextFunction } from "express";
import { Doctor } from "@/models/Doctor";
import { createError } from "@/middleware/errorHandler";

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export const getAllDoctors = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const page = parseInt((req.query as any)["page"] as string) || 1;
    const limit = parseInt((req.query as any)["limit"] as string) || 10;
    const skip = (page - 1) * limit;
    const { specialization, search, minRating, maxFee } = req.query;

    // Build filter object
    const filter: any = {};

    if (specialization) {
      filter.specialization = { $regex: specialization, $options: "i" };
    }

    if (search) {
      filter.$text = { $search: search as string };
    }

    if (minRating) {
      filter.rating = { $gte: parseFloat(minRating as string) };
    }

    if (maxFee) {
      filter.consultationFee = { $lte: parseFloat(maxFee as string) };
    }

    const [doctors, total] = await Promise.all([
      Doctor.find(filter)
        .sort({ rating: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Doctor.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: doctors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return _next(error);
  }
};

export const getDoctorById = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findById(id);

    if (!doctor) {
      return _next(createError("Doctor not found", 404));
    }

    return res.json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    return _next(error);
  }
};

export const createDoctor = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    // Only admin can create doctors
    if (req.user?.role !== "ADMIN") {
      return _next(createError("Admin access required", 403));
    }

    const doctor = await Doctor.create(req.body);

    res.status(201).json({
      success: true,
      message: "Doctor created successfully",
      data: doctor,
    });
  } catch (error) {
    return _next(error);
  }
};

export const updateDoctor = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Only admin can update doctors
    if (req.user?.role !== "ADMIN") {
      return _next(createError("Admin access required", 403));
    }

    const doctor = await Doctor.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doctor) {
      return _next(createError("Doctor not found", 404));
    }

    return res.json({
      success: true,
      message: "Doctor updated successfully",
      data: doctor,
    });
  } catch (error) {
    return _next(error);
  }
};

export const deleteDoctor = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Only admin can delete doctors
    if (req.user?.role !== "ADMIN") {
      return _next(createError("Admin access required", 403));
    }

    const doctor = await Doctor.findByIdAndDelete(id);

    if (!doctor) {
      return _next(createError("Doctor not found", 404));
    }

    return res.json({
      success: true,
      message: "Doctor deleted successfully",
    });
  } catch (error) {
    return _next(error);
  }
};

export const getDoctorSpecializations = async (
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const specializations = await Doctor.distinct("specialization");

    return res.json({
      success: true,
      data: specializations,
    });
  } catch (error) {
    return _next(error);
  }
};
