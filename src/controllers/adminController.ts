import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Doctor } from "../models/Doctor";
import { Test } from "../models/Test";
import { Appointment } from "../models/Appointment";
import { Payment } from "../models/Payment";

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments({ role: "USER" });
    const totalDoctors = await Doctor.countDocuments();
    const totalTests = await Test.countDocuments();
    const totalAppointments = await Appointment.countDocuments();
    const totalPayments = await Payment.countDocuments();

    const recentAppointments = await Appointment.find()
      .populate("userId", "username email")
      .populate("doctorId", "name specialization")
      .populate("testId", "name category")
      .sort({ createdAt: -1 })
      .limit(5);

    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          paymentStatus: "completed",
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            $lt: new Date(
              new Date().getFullYear(),
              new Date().getMonth() + 1,
              1
            ),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
        },
      },
    ]);

    return res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalDoctors,
          totalTests,
          totalAppointments,
          totalPayments,
          monthlyRevenue: monthlyRevenue[0]?.totalRevenue || 0,
        },
        recentAppointments,
      },
    });
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get dashboard statistics",
    });
  }
};

export const getAllDoctors = async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query as any)["page"] as string) || 1;
    const limit = parseInt((req.query as any)["limit"] as string) || 10;
    const skip = (page - 1) * limit;
    const { specialization, search, minRating, maxFee } = req.query;

    // Build filter object - Admin can see ALL doctors
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
    console.error("Error getting doctors:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get doctors",
    });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query as any)["page"] as string) || 1;
    const limit = parseInt((req.query as any)["limit"] as string) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({ role: "USER" })
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments({ role: "USER" });

    return res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          hasNext: page < Math.ceil(totalUsers / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error getting users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get users",
    });
  }
};

export const createDoctor = async (req: Request, res: Response) => {
  try {
    const doctor = new Doctor(req.body);
    await doctor.save();

    return res.status(201).json({
      success: true,
      message: "Doctor created successfully",
      data: doctor,
    });
  } catch (error) {
    console.error("Error creating doctor:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create doctor",
    });
  }
};

export const updateDoctor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findByIdAndUpdate(id, req.body, { new: true });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.json({
      success: true,
      message: "Doctor updated successfully",
      data: doctor,
    });
  } catch (error) {
    console.error("Error updating doctor:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update doctor",
    });
  }
};

export const deleteDoctor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findByIdAndDelete(id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.json({
      success: true,
      message: "Doctor deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete doctor",
    });
  }
};

export const createTest = async (req: Request, res: Response) => {
  try {
    const test = new Test(req.body);
    await test.save();

    return res.status(201).json({
      success: true,
      message: "Test created successfully",
      data: test,
    });
  } catch (error) {
    console.error("Error creating test:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create test",
    });
  }
};

export const updateTest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const test = await Test.findByIdAndUpdate(id, req.body, { new: true });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    return res.json({
      success: true,
      message: "Test updated successfully",
      data: test,
    });
  } catch (error) {
    console.error("Error updating test:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update test",
    });
  }
};

export const deleteTest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const test = await Test.findByIdAndDelete(id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    return res.json({
      success: true,
      message: "Test deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting test:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete test",
    });
  }
};

export const getAllAppointments = async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query as any)["page"] as string) || 1;
    const limit = parseInt((req.query as any)["limit"] as string) || 10;
    const skip = (page - 1) * limit;

    const appointments = await Appointment.find()
      .populate("userId", "username email")
      .populate("doctorId", "name specialization")
      .populate("testId", "name category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalAppointments = await Appointment.countDocuments();

    return res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalAppointments / limit),
          totalAppointments,
          hasNext: page < Math.ceil(totalAppointments / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error getting appointments:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get appointments",
    });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: role || "USER",
    });

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete (userResponse as any).password;

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: userResponse,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if email or username is being changed and if it conflicts with existing users
    if (email !== existingUser.email || username !== existingUser.username) {
      const conflictUser = await User.findOne({
        _id: { $ne: id },
        $or: [{ email }, { username }],
      });

      if (conflictUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email or username already exists",
        });
      }
    }

    const updateData: any = {
      username,
      email,
      role: role || existingUser.role,
    };

    // Only update password if provided
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const user = await User.findByIdAndUpdate(id, updateData, { new: true });

    // Remove password from response
    const userResponse = user?.toObject();
    if (userResponse) {
      delete (userResponse as any).password;
    }

    return res.json({
      success: true,
      message: "User updated successfully",
      data: userResponse,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

export const getAllTests = async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query as any)["page"] as string) || 1;
    const limit = parseInt((req.query as any)["limit"] as string) || 10;
    const skip = (page - 1) * limit;
    const { category, search, minPrice, maxPrice } = req.query;

    // Build filter object - Admin can see ALL tests (including unavailable)
    const filter: any = {};

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$text = { $search: search as string };
    }

    if (minPrice) {
      filter.price = { ...filter.price, $gte: parseFloat(minPrice as string) };
    }

    if (maxPrice) {
      filter.price = { ...filter.price, $lte: parseFloat(maxPrice as string) };
    }

    const [tests, total] = await Promise.all([
      Test.find(filter).sort({ category: 1, price: 1 }).skip(skip).limit(limit),
      Test.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: tests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error getting tests:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get tests",
    });
  }
};

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      appointmentType,
      appointmentDate,
      appointmentTime,
      patientName,
      symptoms,
      notes,
      doctorId,
      testId,
      totalAmount,
    } = req.body;

    // Basic validation
    if (!userId || !appointmentType || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message: "User ID, appointment type, date, and time are required",
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate appointment type specific requirements
    if (appointmentType === "consultation" && !doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required for consultation appointments",
      });
    }

    if (appointmentType === "test" && !testId) {
      return res.status(400).json({
        success: false,
        message: "Test ID is required for test appointments",
      });
    }

    // Verify doctor exists (for consultation)
    if (appointmentType === "consultation" && doctorId) {
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }
    }

    // Verify test exists (for test appointments)
    if (appointmentType === "test" && testId) {
      const test = await Test.findById(testId);
      if (!test) {
        return res.status(404).json({
          success: false,
          message: "Test not found",
        });
      }
    }

    // Check for conflicting appointments
    const conflictingAppointment = await Appointment.findOne({
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: { $in: ["confirmed", "pending"] },
      ...(doctorId && { doctorId }),
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: "Time slot is already booked",
      });
    }

    // Create appointment with proper data structure
    const appointment = new Appointment({
      userId,
      appointmentType,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      patientName,
      symptoms,
      notes,
      doctorId: appointmentType === "consultation" ? doctorId : undefined,
      testId: appointmentType === "test" ? testId : undefined,
      status: "confirmed", // Admin-created appointments are confirmed by default
      totalAmount: totalAmount || 0,
      paymentStatus: "pending",
    });

    await appointment.save();

    // Populate the appointment with related data
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("userId", "username email")
      .populate("doctorId", "name specialization consultationFee")
      .populate("testId", "name category price");

    return res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: populatedAppointment,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create appointment",
    });
  }
};

export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      userId,
      appointmentType,
      appointmentDate,
      appointmentTime,
      patientName,
      symptoms,
      notes,
      doctorId,
      testId,
      totalAmount,
    } = req.body;

    // Basic validation
    if (!userId || !appointmentType || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message: "User ID, appointment type, date, and time are required",
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate appointment type specific requirements
    if (appointmentType === "consultation" && !doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required for consultation appointments",
      });
    }

    if (appointmentType === "test" && !testId) {
      return res.status(400).json({
        success: false,
        message: "Test ID is required for test appointments",
      });
    }

    // Verify doctor exists (for consultation)
    if (appointmentType === "consultation" && doctorId) {
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }
    }

    // Verify test exists (for test appointments)
    if (appointmentType === "test" && testId) {
      const test = await Test.findById(testId);
      if (!test) {
        return res.status(404).json({
          success: false,
          message: "Test not found",
        });
      }
    }

    // Check for conflicting appointments (excluding current appointment)
    const conflictingAppointment = await Appointment.findOne({
      _id: { $ne: id },
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: { $in: ["confirmed", "pending"] },
      ...(doctorId && { doctorId }),
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: "Time slot is already booked",
      });
    }

    // Update appointment with proper data structure
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      {
        userId,
        appointmentType,
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        patientName,
        symptoms,
        notes,
        doctorId: appointmentType === "consultation" ? doctorId : undefined,
        testId: appointmentType === "test" ? testId : undefined,
        totalAmount: totalAmount || 0,
      },
      { new: true }
    );

    if (!updatedAppointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Populate the appointment with related data
    const populatedAppointment = await Appointment.findById(
      updatedAppointment._id
    )
      .populate("userId", "username email")
      .populate("doctorId", "name specialization consultationFee")
      .populate("testId", "name category price");

    return res.json({
      success: true,
      message: "Appointment updated successfully",
      data: populatedAppointment,
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update appointment",
    });
  }
};

export const deleteAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByIdAndDelete(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    return res.json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete appointment",
    });
  }
};

export const updateAppointmentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate("userId", "username email")
      .populate("doctorId", "name specialization")
      .populate("testId", "name category");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    return res.json({
      success: true,
      message: "Appointment status updated successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Error updating appointment status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update appointment status",
    });
  }
};
