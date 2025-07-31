import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import prisma from "../prismaClient";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const createTopic = async (req: any, res: any, next: NextFunction) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You must be logged in to create a project",
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
    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "All fields required",
      });
    }

    const imageFile = req.files?.image;
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
          connect: { id: req.user.userId },
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
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const topic = await prisma.topics.findMany({
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
    return res.status(StatusCodes.OK).json({ data: topic });
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

const updateTopic = async (req: any, res: any, next: NextFunction) => {
  try {
    const userId = req.user.userId;
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
    const imageFile = req.files?.image;
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

    const updatedTopic = await prisma.topics.update({
      where: { id },
      data: {
        name,
        description,
        user: {
          connect: { id: req.user.userId },
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

const deleteTopic = async (req: Request, res: Response, next: NextFunction) => {
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
