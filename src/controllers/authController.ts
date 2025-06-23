import type { Request, Response } from "express"
import { AuthService } from "../services/authService"
import type { RegisterRequest, LoginRequest, AdminLoginRequest, ApiResponse } from "../types"
import type { AuthenticatedRequest } from "../middleware/auth"

export class AuthController {
  private authService: AuthService

  constructor() {
    this.authService = new AuthService()
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const userData: RegisterRequest = req.body

      const result = await this.authService.register(userData)

      const response: ApiResponse = {
        success: true,
        message: "User registered successfully",
        data: {
          token: result.token,
          user: result.user,
          permissions: result.permissions,
          roleInfo: result.roleInfo,
          capabilities: {
            canCreateCampaigns: result.user.role === "community_member",
            canDonate: true,
            canManageProfile: true,
            requiresVerification: !result.user.is_verified,
          },
        },
      }

      res.status(201).json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Registration failed",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginRequest = req.body

      const result = await this.authService.login(loginData)

      const response: ApiResponse = {
        success: true,
        message: "Login successful",
        data: {
          token: result.token,
          user: result.user,
          permissions: result.permissions,
          roleInfo: result.roleInfo,
          capabilities: {
            canCreateCampaigns: result.user.role === "community_member",
            canDonate: true,
            canManageProfile: true,
            requiresVerification: !result.user.is_verified,
          },
        },
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Login failed",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }

  async adminLogin(req: Request, res: Response): Promise<void> {
    try {
      const loginData: AdminLoginRequest = req.body

      const result = await this.authService.adminLogin(loginData)

      const response: ApiResponse = {
        success: true,
        message: "Admin login successful",
        data: {
          token: result.token,
          admin: result.admin,
          permissions: result.permissions,
          roleInfo: result.roleInfo,
          capabilities: {
            canManageUsers: true,
            canManageCampaigns: true,
            canManageCommunityRequests: true,
            canManageAdmins: result.admin.role === "super_admin",
            canAccessSystemSettings: result.admin.role === "super_admin",
          },
        },
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Admin login failed",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }

  async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body

      const result = await this.authService.verifyToken(token)

      if (!result.valid) {
        res.status(401).json({
          success: false,
          message: "Invalid token",
        })
        return
      }

      const response: ApiResponse = {
        success: true,
        message: "Token is valid",
        data: {
          valid: result.valid,
          decoded: result.decoded,
          roleInfo: result.roleInfo,
        },
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: "Invalid token",
        error: error.message,
      }

      res.status(401).json(response)
    }
  }

  async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Use the authenticated user from middleware instead of manually parsing token
      if (!req.user && !req.admin) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        })
        return
      }

      let responseData: any

      if (req.user) {
        // User is authenticated
        responseData = {
          type: "user",
          user: req.user,
          permissions: req.user.permissions,
          roleInfo: {
            role: req.user.role,
            displayName:
              req.user.role === "user" ? "User" : req.user.role === "community_member" ? "Community Member" : "Guest",
            level: this.getUserRoleLevel(req.user.role),
          },
          capabilities: {
            canCreateCampaigns: req.user.role === "community_member",
            canDonate: true,
            canManageProfile: true,
            requiresVerification: !req.user.is_verified,
          },
        }
      } else if (req.admin) {
        // Admin is authenticated
        responseData = {
          type: "admin",
          admin: req.admin,
          permissions: req.admin.permissions,
          roleInfo: {
            role: req.admin.role,
            displayName: req.admin.role === "super_admin" ? "Super Administrator" : "Administrator",
            level: this.getAdminRoleLevel(req.admin.role),
          },
          capabilities: {
            canManageUsers: true,
            canManageCampaigns: true,
            canManageCommunityRequests: true,
            canManageAdmins: req.admin.role === "super_admin",
            canAccessSystemSettings: req.admin.role === "super_admin",
          },
        }
      }

      const response: ApiResponse = {
        success: true,
        message: "Current user retrieved successfully",
        data: responseData,
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: "Failed to get current user",
        error: error.message,
      }

      res.status(500).json(response)
    }
  }

  private getUserRoleLevel(role: string): number {
    const roleLevels: Record<string, number> = {
      guest: 0,
      user: 1,
      community_member: 2,
    }
    return roleLevels[role] || 0
  }

  private getAdminRoleLevel(role: string): number {
    const roleLevels: Record<string, number> = {
      admin: 1,
      super_admin: 2,
    }
    return roleLevels[role] || 0
  }

  async createDebugAdmin(req: Request, res: Response): Promise<void> {
    try {
      // Only allow in development
      if (process.env.NODE_ENV === 'production') {
        res.status(403).json({
          success: false,
          message: 'Debug admin creation not allowed in production'
        });
        return;
      }

      const result = await this.authService.createDebugAdmin();

      const response: ApiResponse = {
        success: true,
        message: 'Debug admin created successfully',
        data: result
      };

      res.status(201).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || 'Failed to create debug admin',
        error: error.message
      };

      res.status(error.statusCode || 500).json(response);
    }
  }
}
