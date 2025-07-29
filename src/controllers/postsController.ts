import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import prisma from "../prismaClient";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const createPost = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You must be logged in to create a post",
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
    let { title, slug, content, topicId } = req.body;
    slug = title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    if (!title || !slug || !content || !topicId) {
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

    // Here you would save the post to the database
    const postData = await prisma.posts.create({
      data: {
        title,
        slug,
        content,
        image: upload.secure_url,
        topic: {
          connect: { id: topicId },
        },
      },
      include: {
        topic: {
          select: {
            name: true,
          },
        },
      },
    });

    res.status(StatusCodes.CREATED).json({
      ...postData,
      topic: postData.topic.name,
    });
  } catch (error: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "Error occurred while creating the post",
    });
  }
};

const getAllPosts = async (req: Request, res: Response) => {
  try {
    const posts = await prisma.posts.findMany({
      include: {
        topic: {
          select: {
            name: true,
          },
        },
      },
    });
    return res.status(StatusCodes.OK).json({
      data: posts,
    });
  } catch (error: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "Error getting posts",
    });
  }
};

const getPost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const postId = await prisma.posts.findUnique({
      where: { id },
      include: {
        topic: {
          select: {
            name: true,
          },
        },
      },
    });
    if (!postId) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Post not found",
      });
    }
    return res.status(StatusCodes.OK).json({
      data: postId,
    });
  } catch (error: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "An error occurred while getting post",
    });
  }
};

const updatePost = async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const existingPost = await prisma.posts.findUnique({
      where: { id },
    });
    if (!existingPost) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "post not found",
      });
    }

    let { title, slug, content, topicId } = req.body;
    slug = title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    if (!title || !slug || !content || !topicId) {
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

    const updatedPost = await prisma.posts.update({
      where: { id },
      data: {
        title,
        slug,
        content,
        image: upload.secure_url,
        topic: {
          connect: { id: topicId },
        },
      },
      include: {
        topic: {
          select: {
            name: true,
          },
        },
      },
    });
    return res.status(StatusCodes.OK).json(updatedPost)
  } catch (error: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "An error occurred while updating post",
    });
  }
};
const deletePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existingProject = await prisma.posts.findUnique({
      where: { id },
    });
    if (!existingProject) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Post not found",
      });
    }
    await prisma.posts.delete({
      where: { id },
    });
    return res
      .status(StatusCodes.OK)
      .json({ message: "Post deleted successfully" });
  } catch (error: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "An error occurred while deleting the post",
    });
  }
};

export { createPost, getAllPosts, getPost, updatePost, deletePost };
