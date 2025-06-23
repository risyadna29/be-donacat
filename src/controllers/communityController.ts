import type { Response } from "express"
import { CommunityService } from "../services/communityService"
import type { AuthenticatedRequest } from "../middleware/auth"
import type { JoinCommunityRequest, ApiResponse } from "../types"

export class CommunityController {
  private communityService: CommunityService

  constructor() {
    this.communityService = new CommunityService()
  }

  async joinCommunity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id
      const requestData: JoinCommunityRequest = req.body
      
      // Get uploaded file from multer
      const ktpPhoto = req.file?.filename || null
      
      console.log('=== COMMUNITY JOIN REQUEST DEBUG ===');
      console.log('User ID:', userId);
      console.log('Request data:', requestData);
      console.log('File info:', req.file);
      console.log('KTP photo filename:', ktpPhoto);
      console.log('File path:', req.file?.path);
      console.log('=====================================');
      
      if (!ktpPhoto) {
        throw new Error("KTP photo is required")
      }

      const communityRequest = await this.communityService.joinCommunity(userId, requestData, ktpPhoto)

      const response: ApiResponse = {
        success: true,
        message: "Community join request submitted successfully",
        data: communityRequest,
      }

      res.status(201).json(response)
    } catch (error: any) {
      console.error('Community join error:', error);
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to submit community request",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }

  async getStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id

      const status = await this.communityService.getCommunityStatus(userId)

      const response: ApiResponse = {
        success: true,
        message: "Community status retrieved successfully",
        data: status,
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to get community status",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }

  async getMyRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id

      const request = await this.communityService.getUserRequest(userId)

      const response: ApiResponse = {
        success: true,
        message: "Community request retrieved successfully",
        data: request,
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to get community request",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }
}
