import type { Request, Response } from "express"
import { CampaignService } from "../services/campaignService"
import type { AuthenticatedRequest } from "../middleware/auth"
import type { CreateCampaignRequest, ApiResponse } from "../types"

export class CampaignController {
  private campaignService: CampaignService

  constructor() {
    this.campaignService = new CampaignService()
  }

  async getAllCampaigns(req: Request, res: Response): Promise<void> {
    try {
      const campaigns = await this.campaignService.getAllCampaigns()

      const response: ApiResponse = {
        success: true,
        message: "Campaigns retrieved successfully",
        data: campaigns,
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to get campaigns",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }

  async getFeaturedCampaigns(req: Request, res: Response): Promise<void> {
    try {
      const campaigns = await this.campaignService.getFeaturedCampaigns()

      const response: ApiResponse = {
        success: true,
        message: "Featured campaigns retrieved successfully",
        data: campaigns,
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to get featured campaigns",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }

  async getCampaignById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const campaign = await this.campaignService.getCampaignById(id)

      const response: ApiResponse = {
        success: true,
        message: "Campaign retrieved successfully",
        data: campaign,
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to get campaign",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }

  async getMyCampaigns(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id
      const campaigns = await this.campaignService.getUserCampaigns(userId)

      const response: ApiResponse = {
        success: true,
        message: "User campaigns retrieved successfully",
        data: campaigns,
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to get user campaigns",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }

  async createCampaign(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const campaignData: CreateCampaignRequest = req.body;
      
      // Get the uploaded image filename from multer
      const imageFilename = req.file?.filename;

      if (!imageFilename) {
        res.status(400).json({
          success: false,
          message: "Campaign image is required.",
        });
        return;
      }
      
      const campaign = await this.campaignService.createCampaign(userId, campaignData, imageFilename);

      const response: ApiResponse = {
        success: true,
        message: "Campaign created successfully and is pending review.",
        data: campaign,
      };

      res.status(201).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to create campaign",
        error: error.message,
      };

      res.status(error.statusCode || 500).json(response);
    }
  }

  async updateCampaign(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id
      const { id } = req.params
      const updateData = req.body

      const campaign = await this.campaignService.updateCampaign(id, userId, updateData)

      const response: ApiResponse = {
        success: true,
        message: "Campaign updated successfully",
        data: campaign,
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to update campaign",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }
}
