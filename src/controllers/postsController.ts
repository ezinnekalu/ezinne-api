import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import prisma from "../prismaClient";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { Prisma } from "../generated/prisma";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    name: string;
  };
}

const createPost = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
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
  } catch (error) {
    next(error);
  }
};

const getAllPosts = async (req: Request, res: Response, next: NextFunction) => {
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
              content: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        }
      : {};

    const [posts, totalPosts] = await Promise.all([
      prisma.posts.findMany({
        where: searchFilter,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          topic: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.posts.count({
        where: searchFilter,
      }),
    ]);

    const totalPages = Math.ceil(totalPosts / limit);

    return res.status(StatusCodes.OK).json({
      currentPage: page,
      totalPages,
      totalPosts,
      perPage: limit,
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

const getPost = async (req: Request, res: Response, next: NextFunction) => {
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
  } catch (error) {
    next(error);
  }
};

const updatePost = async (req: AuthenticatedRequest, res: any, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
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
    return res.status(StatusCodes.OK).json(updatedPost);
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req: Request, res: Response, next: NextFunction) => {
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
  } catch (error) {
    next(error);
  }
};

export { createPost, getAllPosts, getPost, updatePost, deletePost };
