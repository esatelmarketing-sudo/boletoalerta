import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { authMiddleware } from "../../middlewares/auth";
import { register, login, me } from "./auth.controller";
import { registerSchema, loginSchema } from "./auth.schema";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", authMiddleware, me);

export default router;
