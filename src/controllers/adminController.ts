import type { Response } from "express"
import { AdminService } from "../services/adminService"
import type { AuthenticatedRequest } from "../middleware/auth"
import type { ApiResponse } from "../types"
import { AppError } from "../middleware/errorHandler"

export class AdminController {
  private adminService: AdminService

  constructor() {
    this.adminService = new AdminService()
  }

  async getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const dashboard = await this.adminService.getDashboardStats()

      const response: ApiResponse = {
        success: true,
        message: "Dashboard data retrieved successfully",
        data: dashboard,
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to get dashboard data",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }

  async getCommunityRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requests = await this.adminService.getCommunityRequests()
      res.json({ success: true, message: "Community requests retrieved", data: requests })
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, message: error.message || "Failed to retrieve community requests" })
    }
  }

  async reviewCommunityRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { requestId } = req.params
      const { status, admin_notes } = req.body

      if (!status || !["approved", "rejected"].includes(status)) {
        throw new AppError("Invalid status provided. Must be 'approved' or 'rejected'.", 400)
      }

      if (!admin_notes) {
        throw new AppError("Admin notes are required for review.", 400)
      }

      const updatedRequest = await this.adminService.reviewCommunityRequest(requestId, status, admin_notes)
      res.json({ success: true, message: `Request ${status} successfully`, data: updatedRequest })
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, message: error.message || "Failed to process request" })
    }
  }

  async getCampaigns(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const campaigns = await this.adminService.getAllCampaigns()

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

  async reviewCampaign(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.admin?.id
      const { campaignId } = req.params
      const { status, admin_notes } = req.body

      if (!adminId) {
        throw new AppError("Admin authentication failed.", 401)
      }
      
      if (!status || !['active', 'rejected'].includes(status)) {
        throw new AppError("Invalid status. Must be 'active' or 'rejected'.", 400)
      }

      if (!admin_notes) {
        throw new AppError("Admin notes are required.", 400)
      }

      const campaign = await this.adminService.reviewCampaign(campaignId, adminId, status, admin_notes)

      const response: ApiResponse = {
        success: true,
        message: "Campaign reviewed successfully",
        data: campaign,
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to review campaign",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }

  async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const users = await this.adminService.getAllUsers()

      const response: ApiResponse = {
        success: true,
        message: "Users retrieved successfully",
        data: users,
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to get users",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }

  async updateUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const { is_verified } = req.body

      const user = await this.adminService.updateUserStatus(id, is_verified)

      const response: ApiResponse = {
        success: true,
        message: "User status updated successfully",
        data: user,
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to update user status",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }

  async updateUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const { role } = req.body

      const user = await this.adminService.updateUserRole(id, role)

      const response: ApiResponse = {
        success: true,
        message: "User role updated successfully",
        data: user,
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to update user role",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }

  async getAdmins(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const admins = await this.adminService.getAllAdmins()

      const response: ApiResponse = {
        success: true,
        message: "Admins retrieved successfully",
        data: admins,
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to get admins",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }

  async createAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminData = req.body

      const admin = await this.adminService.createAdmin(adminData)

      const response: ApiResponse = {
        success: true,
        message: "Admin created successfully",
        data: admin,
      }

      res.status(201).json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to create admin",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }

  async updateAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const updateData = req.body

      const admin = await this.adminService.updateAdmin(id, updateData)

      const response: ApiResponse = {
        success: true,
        message: "Admin updated successfully",
        data: admin,
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to update admin",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }
}
