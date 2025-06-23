import express from "express"
import { AuthController } from "../controllers/authController"
import { validateRequest, authSchemas } from "../middleware/validation"
import { authenticateAny } from "../middleware/auth"

const router = express.Router()
const authController = new AuthController()

// Public routes
router.post("/register", validateRequest(authSchemas.register), authController.register.bind(authController))
router.post("/login", validateRequest(authSchemas.login), authController.login.bind(authController))
router.post("/admin/login", validateRequest(authSchemas.adminLogin), authController.adminLogin.bind(authController))
// Debug route untuk membuat admin (development only)
router.post("/debug/admin", authController.createDebugAdmin.bind(authController))
router.post("/verify-token", authController.verifyToken.bind(authController))

// Protected routes - can be accessed by both users and admins
router.get("/me", authenticateAny, authController.getCurrentUser.bind(authController))

export default router
