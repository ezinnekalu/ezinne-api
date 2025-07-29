import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import prisma from "../prismaClient";

const createTopic = async (req: any, res: any) => {
  try {
    const userId = req.user.userId
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You must be logged in to create a project"
      })
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId}
    })
    if (!existingUser) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "User not found please login again"
      })
    }
    const { name } = req.body;
    if (!name) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Name field required"
      })
    }
    const topic = await prisma.topics.create({
      data: {
        name,
        user: {
          connect: { id: req.user.userId }
        }
      },
    });
    return res.status(StatusCodes.CREATED).json(topic);
  } catch (error: any) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({
        message: error.message || "An error occurred while creating topic",
      });
  }
};
const getAllTopics = async (req: Request, res: Response) => {
  try {
    const topic = await prisma.topics.findMany()
    return res.status(StatusCodes.OK).json({ data: topic});
  } catch (error: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "An error occurred while fetching the topics"
    })
  }
};
const getTopic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const topicId = await prisma.topics.findUnique({
      where: { id }
    })
    if (!topicId) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Topic not found"
      })
    }
    return res.status(StatusCodes.OK).json({ data: topicId})
  } catch (error: any) {
     return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
       message: error.message || "An error occurred while fetching the topic",
     });
  }
};
const updateTopic = async (req: any, res: any) => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    const { name } = req.body
    const existingTopic = await prisma.topics.findUnique({
      where: { id }
    })
    if (!existingTopic || existingTopic.userId !== userId) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Unauthorized to update this topic or topic not found",
      });
    }
    if (!name) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Name field is required"
      })
    }
    const updatedTopic = await prisma.topics.update({
      where: { id },
      data: {
        name,
        user: {
          connect: { id: req.user.userId}
        }
      }
    })
    return res.status(StatusCodes.OK).json(updatedTopic);
  } catch (error: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "An error occurred while updating topic"
    })
  }
};
const deleteTopic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const existingTopic = await prisma.topics.findUnique({
      where: { id }
    })
    if (!existingTopic) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Topic not found"
      })
    }
    await prisma.topics.delete({
      where: { id }
    })
    return res.status(StatusCodes.OK).json({
      message: "Topic Deleted successfully"
    })
  } catch (error: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "An error occurred while deleting the topic",
    });
  }
};

export { createTopic, getAllTopics, getTopic, updateTopic, deleteTopic };
