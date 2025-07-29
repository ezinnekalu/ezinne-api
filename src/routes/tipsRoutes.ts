import express from "express";
import {
  createTips,
  deleteTip,
  getAllTips,
  getTip,
  updateTip,
} from "../controllers/tipsController";
import authMiddleware from "../middleware/auth";

const router = express.Router();

router.route("/tips").post(authMiddleware, createTips).get(getAllTips);
router
  .route("/tips/:id")
  .get(getTip)
  .put(authMiddleware, updateTip)
  .delete(authMiddleware, deleteTip);

export default router;
