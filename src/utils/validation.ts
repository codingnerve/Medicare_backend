import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { createError } from "@/middleware/errorHandler";

export const validateRequest = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);
    return next(
      createError(`Validation failed: ${errorMessages.join(", ")}`, 400)
    );
  }
  next();
};

export const validateLogin = [
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  validateRequest,
];

export const validateRegister = [
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),

  validateRequest,
];

export const validateCreateUser = [
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  body("role")
    .optional()
    .isIn(["USER", "ADMIN"])
    .withMessage("Role must be either USER or ADMIN"),

  validateRequest,
];

export const validateCreateDoctor = [
  body("name")
    .notEmpty()
    .withMessage("Doctor name is required")
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),

  body("specialization")
    .notEmpty()
    .withMessage("Specialization is required")
    .isLength({ max: 100 })
    .withMessage("Specialization cannot exceed 100 characters"),

  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage("Please provide a valid phone number"),

  body("experience")
    .isInt({ min: 0, max: 50 })
    .withMessage("Experience must be between 0 and 50 years"),

  body("consultationFee")
    .isInt({ min: 0 })
    .withMessage("Consultation fee cannot be negative"),

  body("bio")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Bio cannot exceed 1000 characters"),

  validateRequest,
];

export const validateCreateTest = [
  body("name")
    .notEmpty()
    .withMessage("Test name is required")
    .isLength({ max: 100 })
    .withMessage("Test name cannot exceed 100 characters"),

  body("description")
    .notEmpty()
    .withMessage("Test description is required")
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("category")
    .isIn([
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
    ])
    .withMessage("Invalid test category"),

  body("price").isInt({ min: 0 }).withMessage("Price cannot be negative"),

  body("duration")
    .isInt({ min: 5, max: 480 })
    .withMessage("Duration must be between 5 and 480 minutes"),

  body("preparationInstructions")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Preparation instructions cannot exceed 1000 characters"),

  body("normalRange")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Normal range cannot exceed 200 characters"),

  body("isAvailable")
    .optional()
    .isBoolean()
    .withMessage("isAvailable must be a boolean"),

  validateRequest,
];

export const validateCreateAppointment = [
  body("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),

  body("appointmentType")
    .isIn(["consultation", "test"])
    .withMessage("Appointment type must be either consultation or test"),

  body("doctorId")
    .optional()
    .custom((value, { req }) => {
      // Only validate if appointmentType is "consultation"
      if (req.body.appointmentType === "consultation") {
        if (!value) {
          throw new Error(
            "Doctor ID is required for consultation appointments"
          );
        }
        // Validate MongoDB ObjectId only if value is provided
        if (value && !/^[0-9a-fA-F]{24}$/.test(value)) {
          throw new Error("Doctor ID must be a valid MongoDB ObjectId");
        }
      }
      // For test appointments, doctorId should be empty or undefined
      if (req.body.appointmentType === "test" && value) {
        throw new Error(
          "Doctor ID should not be provided for test appointments"
        );
      }
      return true;
    }),

  body("testId")
    .optional()
    .custom((value, { req }) => {
      // Only validate if appointmentType is "test" and testId is provided
      if (req.body.appointmentType === "test") {
        if (!value) {
          throw new Error("Test ID is required for test appointments");
        }
        // Validate MongoDB ObjectId only if value is provided
        if (value && !/^[0-9a-fA-F]{24}$/.test(value)) {
          throw new Error("Test ID must be a valid MongoDB ObjectId");
        }
      }
      // For consultation appointments, testId should be empty or undefined
      if (req.body.appointmentType === "consultation" && value) {
        throw new Error(
          "Test ID should not be provided for consultation appointments"
        );
      }
      return true;
    }),

  body("appointmentDate")
    .isISO8601()
    .withMessage("Please provide a valid appointment date")
    .custom((value) => {
      const appointmentDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Allow appointments for today and future dates
      if (appointmentDate < today) {
        throw new Error("Appointment date cannot be in the past");
      }

      // Optional: Check if appointment is too far in the future (e.g., more than 1 year)
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      if (appointmentDate > oneYearFromNow) {
        throw new Error(
          "Appointment date cannot be more than 1 year in the future"
        );
      }

      return true;
    }),

  body("appointmentTime")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Please provide a valid time format (HH:MM)"),

  body("totalAmount")
    .isInt({ min: 0 })
    .withMessage("Total amount cannot be negative"),

  body("patientName")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Patient name cannot exceed 100 characters"),

  body("symptoms")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Symptoms cannot exceed 1000 characters"),

  body("notes")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Notes cannot exceed 1000 characters"),

  validateRequest,
];
