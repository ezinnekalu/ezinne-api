import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import prisma from "../prismaClient";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { Prisma } from "../generated/prisma";

interface AuthRequest extends Request {
  user?: {
    userId: string;
    name: string;
  };
}

const createTopic = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "All fields required",
      });
    }

    const imageFile = req.files?.image as any;
    if (!imageFile || !imageFile.mimetype.startsWith("image")) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Image file is required and must be an image",
      });
    }
    if (imageFile > 2 * 1024 * 1024) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Image file must be under 2MB",
      });
    }
    const upload = await cloudinary.uploader.upload(imageFile.tempFilePath, {
      use_filename: true,
      folder: "siteassets",
    });
    fs.unlinkSync(imageFile.tempFilePath);

    // Here you would save the topic to the database
    const topic = await prisma.topics.create({
      data: {
        name,
        description,
        image: upload.secure_url,
        user: {
          connect: { id: req.user!.userId },
        },
      },
      include: {
        posts: {
          select: {
            id: true,
            title: true,
            image: true,
            content: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
    return res.status(StatusCodes.CREATED).json(topic);
  } catch (error) {
    next(error);
  }
};

const getAllTopics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string)?.trim() || "";

    const searchFilter = search
      ? {
          OR: [
            {
              name: {
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

    const [topic, totalTopic] = await Promise.all([
      prisma.topics.findMany({
        where: searchFilter,
        skip,
        take: limit,
        include: {
          posts: {
            select: {
              id: true,
              title: true,
              image: true,
              content: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      }),
      prisma.topics.count({
        where: searchFilter
      })
    ]) 

    const totalPages = Math.ceil(totalTopic / limit)

    return res.status(StatusCodes.OK).json({ 
      currentPage: page,
      totalPages,
      totalTopic,
      perPage: limit,
      data: topic 
    });
  } catch (error) {
    next(error);
  }
};

const getTopic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const topicId = await prisma.topics.findUnique({
      where: { id },
      include: {
        posts: {
          select: {
            id: true,
            title: true,
            image: true,
            content: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
    if (!topicId) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Topic not found",
      });
    }
    return res.status(StatusCodes.OK).json({ data: topicId });
  } catch (error) {
    next(error);
  }
};

const updateTopic = async (req: AuthRequest, res: any, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { name, description } = req.body;
    const existingTopic = await prisma.topics.findUnique({
      where: { id },
    });
    if (!existingTopic || existingTopic.userId !== userId) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Unauthorized to update this topic or topic not found",
      });
    }
    if (!name || !description) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "All fields are required",
      });
    }

    // upload image to cloudinary and verify if it is an image
    const imageFile = req.files?.image as any;
    if (!imageFile || !imageFile.mimetype.startsWith("image")) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Image file is required and must be an image",
      });
    }
    if (imageFile.size > 2 * 1024 * 1024) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Image file must be under 2MB",
      });
    }
    const upload = await cloudinary.uploader.upload(imageFile.tempFilePath, {
      use_filename: true,
      folder: "siteassets",
    });
    fs.unlinkSync(imageFile.tempFilePath);

    const updatedTopic = await prisma.topics.update({
      where: { id },
      data: {
        name,
        description,
        user: {
          connect: { id: req.user!.userId },
        },
      },
      include: {
        posts: {
          select: {
            id: true,
            title: true,
            image: true,
            content: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
    return res.status(StatusCodes.OK).json(updatedTopic);
  } catch (error) {
    next(error);
  }
};

const deleteTopic = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existingTopic = await prisma.topics.findUnique({
      where: { id },
    });
    if (!existingTopic) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Topic not found",
      });
    }
    await prisma.topics.delete({
      where: { id },
    });
    return res.status(StatusCodes.OK).json({
      message: "Topic Deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export { createTopic, getAllTopics, getTopic, updateTopic, deleteTopic };
