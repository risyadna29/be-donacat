import type { Response } from "express"
import { DonationService } from "../services/donationService"
import type { AuthenticatedRequest } from "../middleware/auth"
import type { CreateDonationRequest, ApiResponse } from "../types"

export class DonationController {
  private donationService: DonationService

  constructor() {
    this.donationService = new DonationService()
  }

  async createDonation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id
      const donationData: CreateDonationRequest = req.body

      const donation = await this.donationService.createDonation(userId, donationData)

      const response: ApiResponse = {
        success: true,
        message: "Donation created successfully",
        data: donation,
      }

      res.status(201).json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to create donation",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }

  async getMyDonations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id

      const donations = await this.donationService.getUserDonations(userId)

      const response: ApiResponse = {
        success: true,
        message: "User donations retrieved successfully",
        data: donations,
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to get user donations",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }

  async getDonationById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id
      const { id } = req.params

      const donation = await this.donationService.getDonationById(id, userId)

      const response: ApiResponse = {
        success: true,
        message: "Donation retrieved successfully",
        data: donation,
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to get donation",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }

  async updatePaymentStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id
      const { id } = req.params
      const { payment_status, transaction_id } = req.body

      const donation = await this.donationService.updatePaymentStatus(id, userId, payment_status, transaction_id)

      const response: ApiResponse = {
        success: true,
        message: "Payment status updated successfully",
        data: donation,
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to update payment status",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }
}
