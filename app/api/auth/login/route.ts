import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";
import { signToken } from "@/lib/auth";
import { errorResponse, handleRouteError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return errorResponse("Invalid credentials", 401);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return errorResponse("Invalid credentials", 401);

    const token = signToken({ userId: user.id, role: user.role });
    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
