import express from 'express'
import { createTopic, deleteTopic, getAllTopics, getTopic, updateTopic } from '../controllers/topicsController'
import authMiddleware from '../middleware/auth'

const router = express.Router()

router.route("/topics").post(authMiddleware, createTopic).get(getAllTopics)
router.route('/topics/:id').get(getTopic).put(authMiddleware, updateTopic).delete(authMiddleware, deleteTopic)

export default router