import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { errorHandler } from "@/middleware/errorHandler";
import { notFound } from "@/middleware/notFound";
import { logger } from "@/utils/logger";
import { connectDB } from "@/utils/mongodb";
import { seedDatabase } from "@/utils/seeder";

// Routes
import authRoutes from "@/routes/auth";
import userRoutes from "@/routes/users";
import doctorRoutes from "@/routes/doctors";
import testRoutes from "@/routes/tests";
import appointmentRoutes from "@/routes/appointments";
import paymentRoutes from "@/routes/payments";
import adminRoutes from "@/routes/admin";
import supportRoute from "@/routes/support";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env["PORT"] || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env["RATE_LIMIT_WINDOW_MS"] || "900000"), // 15 minutes
  max: parseInt(process.env["RATE_LIMIT_MAX_REQUESTS"] || "100"), // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
});
app.use(limiter);

// CORS configuration
app.use(
  cors({
    origin: process.env["CORS_ORIGIN"] || "http://localhost:3000",
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(
  morgan("combined", {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env["NODE_ENV"] || "development",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/support", supportRoute);
// 404 handler
app.use(notFound);

// Error handling middleware (must be last)
app.use(errorHandler);

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();
    
    // Seed database with initial data
    await seedDatabase();
    
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(
        `📊 Environment: ${process.env["NODE_ENV"] || "development"}`
      );
      logger.info(
        `🌐 CORS origin: ${
          process.env["CORS_ORIGIN"] || "http://localhost:3000"
        }`
      );
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
