// middlewares/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err.message?.includes("Can't reach database server")) {
    return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
      message:
        "We're having trouble connecting to the database. Please try again shortly.",
    });
  }

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: "Something went wrong. Please try again.",
  });
};
