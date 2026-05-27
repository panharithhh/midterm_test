import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { loginSchema, registerSchema } from "../lib/validators";
import { signToken } from "../lib/auth";
import { errorResponse, handleRouteError } from "../lib/errors";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return errorResponse(res, "Validation failed", 400, parsed.error.flatten());
    }
    const { email, password, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return errorResponse(res, "Email already in use", 409);

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, role },
      select: { id: true, email: true, role: true },
    });

    res.status(201).json(user);
  } catch (err) {
    handleRouteError(err, res);
  }
});

router.post("/login", async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return errorResponse(res, "Validation failed", 400, parsed.error.flatten());
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return errorResponse(res, "Invalid credentials", 401);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return errorResponse(res, "Invalid credentials", 401);

    const token = signToken({ userId: user.id, role: user.role });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    handleRouteError(err, res);
  }
});

export default router;
