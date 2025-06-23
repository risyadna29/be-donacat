import express from "express"
import { DonationController } from "../controllers/donationController"
import { authenticateToken } from "../middleware/auth"
import { validateRequest, donationSchemas } from "../middleware/validation"

const router = express.Router()
const donationController = new DonationController()

// All routes require authentication
router.use(authenticateToken)

// Donation management
router.post(
  "/",
  validateRequest(donationSchemas.createDonation),
  donationController.createDonation.bind(donationController),
)

router.get("/my", donationController.getMyDonations.bind(donationController))
router.get("/:id", donationController.getDonationById.bind(donationController))

// Payment management
router.put("/:id/payment", donationController.updatePaymentStatus.bind(donationController))

export default router
