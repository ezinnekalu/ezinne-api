import { Request, Response } from "express";
import prisma from "../prismaClient";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcryptjs";
import { createJWT } from "../utils/jwt";
import validator from "validator";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 24 * 60 * 60 * 1000, // 1 day
}

const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "All fields are required",
      });
    }

    const isValidEmail = (email: string) =>
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
        email
      );

    if (!isValidEmail(email)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Invalid email address",
      });
    }

    const userCount = await prisma.user.count();
    if (userCount >= 2) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: "Registration limit reached. Only two users are allowed.",
      });
    }

    const userExists = await prisma.user.findUnique({
      where: { email },
    });
    if (userExists) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Email already in use",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    const token = createJWT({ userId: user.id, name: user.name });

    res.cookie("token", token, cookieOptions)

    return res.status(StatusCodes.CREATED).json({
      user: { id: user.id, name: user.name },
      token,
    });
  } catch (error: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "An error occurred while creating user",
    });
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Invalid Credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Invalid Credentials",
      });
    }

    const token = createJWT({ userId: user.id, name: user.name });

    res.cookie("token", token, cookieOptions)

    return res.status(StatusCodes.OK).json({
      user: { id: user.id, name: user.name },
      token,
    });
  } catch (error: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "An error occurred while logging in",
    });
  }
};

const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    })

    return res.status(StatusCodes.OK).json({
      message: "Logged out successfully"
    })
  } catch (error: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "An error occurred while logging out",
    });
  }
}

export { register, login, logout };
