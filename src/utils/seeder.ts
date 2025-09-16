import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Doctor } from "../models/Doctor";
import { Test } from "../models/Test";
import { Appointment } from "../models/Appointment";
import { Payment } from "../models/Payment";
import { logger } from "./logger";

export const seedDatabase = async () => {
  try {
    logger.info("🌱 Starting database seeding...");

    // Check if admin user already exists
    const adminExists = await User.findOne({ username: "admin" });
    
    if (adminExists) {
      logger.info("✅ Admin user already exists. Skipping seeder.");
      return;
    }

    // Clear existing data
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Test.deleteMany({});
    await Appointment.deleteMany({});
    await Payment.deleteMany({});

    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 12);
    const admin = await User.create({
      username: "admin",
      email: "admin@example.com",
      password: adminPassword,
      role: "ADMIN",
    });

    // Create test user
    const userPassword = await bcrypt.hash("user123", 12);
    const user = await User.create({
      username: "testuser",
      email: "user@example.com",
      password: userPassword,
      role: "USER",
    });

    // Create sample doctors
    const doctors = await Doctor.insertMany([
      {
        name: "Dr. Sarah Johnson",
        specialization: "Cardiology",
        email: "sarah.johnson@hospital.com",
        phone: "+1-555-0101",
        experience: 15,
        consultationFee: 150,
        rating: 4.8,
        totalRatings: 120,
        bio: "Experienced cardiologist with expertise in heart disease treatment and prevention.",
        qualifications: [
          "MD Cardiology",
          "Fellowship in Interventional Cardiology",
        ],
        availableSlots: [
          {
            day: "Monday",
            startTime: "09:00",
            endTime: "17:00",
            isAvailable: true,
          },
          {
            day: "Wednesday",
            startTime: "09:00",
            endTime: "17:00",
            isAvailable: true,
          },
          {
            day: "Friday",
            startTime: "09:00",
            endTime: "17:00",
            isAvailable: true,
          },
        ],
      },
      {
        name: "Dr. Michael Chen",
        specialization: "Neurology",
        email: "michael.chen@hospital.com",
        phone: "+1-555-0102",
        experience: 12,
        consultationFee: 180,
        rating: 4.7,
        totalRatings: 95,
        bio: "Neurologist specializing in brain and nervous system disorders.",
        qualifications: ["MD Neurology", "Board Certified Neurologist"],
        availableSlots: [
          {
            day: "Tuesday",
            startTime: "10:00",
            endTime: "18:00",
            isAvailable: true,
          },
          {
            day: "Thursday",
            startTime: "10:00",
            endTime: "18:00",
            isAvailable: true,
          },
        ],
      },
      {
        name: "Dr. Emily Davis",
        specialization: "Pediatrics",
        email: "emily.davis@hospital.com",
        phone: "+1-555-0103",
        experience: 8,
        consultationFee: 120,
        rating: 4.9,
        totalRatings: 200,
        bio: "Pediatrician with a passion for children's health and development.",
        qualifications: ["MD Pediatrics", "Child Development Specialist"],
        availableSlots: [
          {
            day: "Monday",
            startTime: "08:00",
            endTime: "16:00",
            isAvailable: true,
          },
          {
            day: "Wednesday",
            startTime: "08:00",
            endTime: "16:00",
            isAvailable: true,
          },
          {
            day: "Friday",
            startTime: "08:00",
            endTime: "16:00",
            isAvailable: true,
          },
        ],
      },
    ]);

    // Create sample tests
    const tests = await Test.insertMany([
      {
        name: "Complete Blood Count (CBC)",
        description:
          "A comprehensive blood test that measures different components of blood",
        category: "Blood Test",
        price: 45,
        duration: 30,
        preparationInstructions:
          "Fasting not required. Avoid heavy meals 2 hours before test.",
        normalRange: "Varies by component",
        isAvailable: true,
      },
      {
        name: "MRI Brain Scan",
        description:
          "Magnetic resonance imaging of the brain to detect abnormalities",
        category: "Imaging",
        price: 800,
        duration: 60,
        preparationInstructions:
          "Remove all metal objects. Fasting required for 4 hours.",
        normalRange: "Normal brain structure",
        isAvailable: true,
      },
      {
        name: "ECG (Electrocardiogram)",
        description: "Test to check heart rhythm and electrical activity",
        category: "Cardiology",
        price: 75,
        duration: 15,
        preparationInstructions: "No special preparation required.",
        normalRange: "Normal sinus rhythm",
        isAvailable: true,
      },
      {
        name: "Urine Analysis",
        description:
          "Complete analysis of urine sample for various health indicators",
        category: "Urine Test",
        price: 35,
        duration: 20,
        preparationInstructions:
          "First morning urine preferred. Clean catch method.",
        normalRange: "Normal values for all parameters",
        isAvailable: true,
      },
    ]);

    // Create sample appointments
    const appointments = await Appointment.insertMany([
      {
        userId: user._id.toString(),
        doctorId: doctors[0]?._id.toString(),
        appointmentType: "consultation",
        appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        appointmentTime: "10:00",
        status: "confirmed",
        symptoms: "Chest pain and shortness of breath",
        notes: "Patient reports symptoms for the past 3 days",
        totalAmount: doctors[0]?.consultationFee || 0,
        paymentStatus: "paid",
      },
      {
        userId: user._id.toString(),
        testId: tests[0]?._id.toString(),
        appointmentType: "test",
        appointmentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        appointmentTime: "09:00",
        status: "pending",
        notes: "Routine blood test as requested by doctor",
        totalAmount: tests[0]?.price || 0,
        paymentStatus: "pending",
      },
    ]);

    // Create sample payments
    const payments = await Payment.insertMany([
      {
        userId: user._id.toString(),
        appointmentId: appointments[0]?._id.toString(),
        amount: appointments[0]?.totalAmount || 0,
        currency: "INR",
        paymentMethod: "credit_card",
        paymentStatus: "completed",
        transactionId: `TXN_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        gatewayResponse: {
          status: "success",
          message: "Payment processed successfully",
          timestamp: new Date(),
        },
      },
    ]);

    logger.info("✅ Database seeded successfully!");
    logger.info(`👤 Admin user: admin / admin123`);
    logger.info(`👤 Test user: testuser / user123`);
    logger.info(`👨‍⚕️ Created ${doctors.length} doctors`);
    logger.info(`🧪 Created ${tests.length} tests`);
    logger.info(`📅 Created ${appointments.length} appointments`);
    logger.info(`💳 Created ${payments.length} payments`);
  } catch (error) {
    logger.error("❌ Error seeding database:", error);
    throw error;
  }
};

