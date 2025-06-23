import express from "express"
import { CampaignController } from "../controllers/campaignController"
import { authenticateToken, requireCommunityMember } from "../middleware/auth"
import { validateRequest, campaignSchemas } from "../middleware/validation"
import { uploadCampaignImages } from "../middleware/upload"

const router = express.Router()
const campaignController = new CampaignController()

// Public routes
router.get("/", campaignController.getAllCampaigns.bind(campaignController))
router.get("/featured", campaignController.getFeaturedCampaigns.bind(campaignController))
router.get("/:id", campaignController.getCampaignById.bind(campaignController))

// Protected routes
router.use(authenticateToken)

// User campaigns
router.get("/my/campaigns", campaignController.getMyCampaigns.bind(campaignController))

// Create campaign (community members only)
router.post(
  "/",
  requireCommunityMember,
  uploadCampaignImages.single("image"),
  validateRequest(campaignSchemas.createCampaign),
  campaignController.createCampaign.bind(campaignController),
)

// Update campaign
router.put("/:id", requireCommunityMember, campaignController.updateCampaign.bind(campaignController))

export default router
