import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import prisma from "../prismaClient";

const createTips = async (req: any, res: any, next: NextFunction) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You must be logged in to create tips",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "User not found please login again",
      });
    }
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Title and Description Required",
      });
    }
    const tip = await prisma.tips.create({
      data: {
        title,
        description,
        user: {
          connect: { id: req.user.userId },
        },
      },
    });
    return res.status(StatusCodes.CREATED).json(tip);
  } catch (error) {
    next(error)
  }
};

const getAllTips = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tips = await prisma.tips.findMany();
    return res.status(StatusCodes.OK).json({ data: tips });
  } catch (error) {
    next(error)
  }
};

const getTip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tipId = await prisma.tips.findUnique({
      where: { id },
    });
    if (!tipId) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Tip not found",
      });
    }
    return res.status(StatusCodes.OK).json({ data: tipId });
  } catch (error) {
    next(error)
  }
};

const updateTip = async (req: any, res: any, next: NextFunction) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const existingTip = await prisma.tips.findUnique({
      where: { id },
    });
    if (!existingTip || existingTip.userId !== userId) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Unauthorized to update this tip or tip not found",
      });
    }
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Title and Description Required",
      });
    }
    const updatedTip = await prisma.tips.update({
      where: { id },
      data: {
        title,
        description,
        user: {
          connect: { id: req.user.userId },
        },
      },
    });
    return res.status(StatusCodes.OK).json(updatedTip)
  } catch (error) {
    next(error)
  }
};

const deleteTip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existingTip = await prisma.tips.findUnique({
      where: { id },
    });
    if (!existingTip) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Tip not found",
      });
    }
    await prisma.tips.delete({
      where: { id },
    });
    return res.status(StatusCodes.OK).json({
      message: "Tip Deleted successfully",
    });
  } catch (error) {
    next(error)
  }
};

export { createTips, getAllTips, getTip, updateTip, deleteTip };