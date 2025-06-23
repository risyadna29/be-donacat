import type { Response } from "express"
import { UserService } from "../services/userService"
import type { AuthenticatedRequest } from "../middleware/auth"
import type { UpdateProfileRequest, ChangePasswordRequest, ApiResponse } from "../types"

export class UserController {
  private userService: UserService

  constructor() {
    this.userService = new UserService()
  }

  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id

      const profile = await this.userService.getProfile(userId)

      const response: ApiResponse = {
        success: true,
        message: "Profile retrieved successfully",
        data: profile,
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to get profile",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id
      const updateData: UpdateProfileRequest = req.body

      const updatedProfile = await this.userService.updateProfile(userId, updateData)

      const response: ApiResponse = {
        success: true,
        message: "Profile updated successfully",
        data: updatedProfile,
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to update profile",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id
      const passwordData: ChangePasswordRequest = req.body

      await this.userService.changePassword(userId, passwordData)

      const response: ApiResponse = {
        success: true,
        message: "Password changed successfully",
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to change password",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }

  async getUserStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id

      const stats = await this.userService.getUserStats(userId)

      const response: ApiResponse = {
        success: true,
        message: "User statistics retrieved successfully",
        data: stats,
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to get user statistics",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }
}
