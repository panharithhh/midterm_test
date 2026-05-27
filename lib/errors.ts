import { NextResponse } from "next/server";

export function errorResponse(
  message: string,
  status: number,
  details?: unknown
): NextResponse {
  return NextResponse.json({ error: message, ...(details ? { details } : {}) }, { status });
}

export function handleRouteError(err: unknown): NextResponse {
  if (
    err &&
    typeof err === "object" &&
    "status" in err &&
    "message" in err
  ) {
    const e = err as { status: number; message: string };
    return errorResponse(e.message, e.status);
  }
  console.error(err);
  return errorResponse("Internal server error", 500);
}
