import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import prisma from "../prismaClient";
import { Prisma } from "../generated/prisma";

interface AuthRequest extends Request {
  user?: {
    userId: string;
    name: string;
  };
}

const createTips = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
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
          connect: { id: req.user!.userId },
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
    const page = parseInt(req.query.page as string) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string)?.trim() || "";

    const searchFilter = search
      ? {
          OR: [
            {
              title: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              description: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        }
      : {};

    const [tips, totalTips] = await Promise.all([
      prisma.tips.findMany({
        where: searchFilter,
        skip,
        take: limit,
      }),
      prisma.tips.count({
        where: searchFilter
      })
    ]) 

    const totalPages = Math.ceil(totalTips / limit)

    return res.status(StatusCodes.OK).json({ 
      currentPage: page,
      totalPages,
      totalTips,
      perPage: limit,
      data: tips 
    });
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

const updateTip = async (req: AuthRequest, res: any, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
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
          connect: { id: req.user!.userId },
        },
      },
    });
    return res.status(StatusCodes.OK).json(updatedTip)
  } catch (error) {
    next(error)
  }
};

const deleteTip = async (req: AuthRequest, res: Response, next: NextFunction) => {
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