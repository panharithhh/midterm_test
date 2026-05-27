import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validators";
import { requireAdmin } from "@/lib/auth";
import { errorResponse, handleRouteError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search") ?? "";
    const minPrice = parseFloat(searchParams.get("minPrice") ?? "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") ?? "999999999");

    const products = await prisma.product.findMany({
      where: {
        name: search ? { contains: search } : undefined,
        price: { gte: isNaN(minPrice) ? 0 : minPrice, lte: isNaN(maxPrice) ? 999999999 : maxPrice },
      },
      select: { id: true, name: true, description: true, price: true, stock: true, createdAt: true },
    });
    return NextResponse.json(products);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req);
    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }
    const product = await prisma.product.create({
      data: parsed.data,
      select: { id: true, name: true, description: true, price: true, stock: true, createdAt: true },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
