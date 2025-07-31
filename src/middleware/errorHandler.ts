import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
} from "@prisma/client/runtime/library";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Prisma can't connect to database (e.g. Supabase down)
  if (
    err instanceof PrismaClientInitializationError ||
    err.message?.includes("Can't reach database server")
  ) {
    return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
      message:
        "We're currently having trouble connecting to the database. Please try again shortly.",
    });
  }

  // Prisma specific known error (optional: like invalid input or constraint violations)
  if (err instanceof PrismaClientKnownRequestError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "A database error occurred: " + err.message,
    });
  }

  // Catch-all fallback
  console.error("Unhandled Error:", err);

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: "Something went wrong. Please try again later.",
  });
};
