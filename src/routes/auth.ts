import { Router } from "express";
import { login, register, refreshToken } from "@/controllers/authController";
import { validateLogin, validateRegister } from "@/utils/validation";

const router = Router();

// POST /api/auth/login
router.post("/login", validateLogin, login);

// POST /api/auth/register
router.post("/register", validateRegister, register);

// POST /api/auth/refresh
router.post("/refresh", refreshToken);

export default router;





