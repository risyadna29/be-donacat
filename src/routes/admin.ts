import { Router } from "express"
import { AdminController } from "../controllers/adminController"
import { authenticateAdmin } from "../middleware/auth"
import { requireAdmin, requireSuperAdmin } from "../middleware/roleAuth"

const router = Router()
const adminController = new AdminController()

// All admin routes require authentication and admin role
router.use(authenticateAdmin, requireAdmin)

// Dashboard
router.get("/dashboard", adminController.getDashboard.bind(adminController))

// Community Requests Management
router.get("/community-requests", adminController.getCommunityRequests.bind(adminController))
router.put("/community-requests/:requestId", adminController.reviewCommunityRequest.bind(adminController))

// Campaign Management
router.get("/campaigns", adminController.getCampaigns.bind(adminController))
router.put("/campaigns/:campaignId/review", adminController.reviewCampaign.bind(adminController))

// User management
router.get("/users", adminController.getUsers.bind(adminController))
router.put("/users/:id/status", adminController.updateUserStatus.bind(adminController))
router.put("/users/:id/role", adminController.updateUserRole.bind(adminController))

// Super admin only routes
router.use("/admins", requireSuperAdmin)
router.get("/admins", adminController.getAdmins.bind(adminController))
router.post("/admins", adminController.createAdmin.bind(adminController))
router.put("/admins/:id", adminController.updateAdmin.bind(adminController))

export default router
