import { Response } from "express";

export function errorResponse(
  res: Response,
  message: string,
  status: number,
  details?: unknown
) {
  res.status(status).json({ error: message, ...(details ? { details } : {}) });
}

export function handleRouteError(err: unknown, res: Response) {
  if (err && typeof err === "object" && "status" in err && "message" in err) {
    const e = err as { status: number; message: string };
    return errorResponse(res, e.message, e.status);
  }
  console.error(err);
  return errorResponse(res, "Internal server error", 500);
}
