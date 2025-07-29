import express from "express";
import {
  createPost,
  deletePost,
  updatePost,
  getAllPosts,
  getPost,
} from "../controllers/postsController";
import authMiddleware from "../middleware/auth";

const router = express.Router();

router.route("/posts").get(getAllPosts).post(authMiddleware, createPost);
router.route("/posts/:id").get(getPost).put(authMiddleware, updatePost).delete(authMiddleware, deletePost);

export default router