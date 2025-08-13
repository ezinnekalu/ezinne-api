import express from 'express'
import { login, logout, register, verifyToken } from '../controllers/authController'
const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)
router.get('/verify', verifyToken)

export default router 