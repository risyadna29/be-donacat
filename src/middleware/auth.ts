import type { Request, Response, NextFunction } from "express"
import db from "../config/database"
import type { User, AdminUser } from "../types"
import { verifyToken, verifyAdminToken } from "../utils/jwt"
import { getUserPermissions, getAdminPermissions } from "../utils/roleUtils"

export interface AuthenticatedRequest extends Request {
  user?: User & { permissions?: string[] }
  admin?: AdminUser & { permissions?: string[] }
}

/**
 * Middleware untuk autentikasi user token dengan role information
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(" ")[1]

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access token required",
      })
      return
    }

    // Verify token menggunakan utility function
    const decoded = verifyToken(token)

    // Get user from database
    const [users] = (await db.execute(
      "SELECT id, name, email, role, phone, gender, birth_date, address, is_verified, created_at, updated_at FROM users WHERE id = ?",
      [decoded.id],
    )) as [User[], any]

    if (users.length === 0) {
      res.status(401).json({
        success: false,
        message: "User not found or token invalid",
      })
      return
    }

    const user = users[0]

    // Add permissions to user object
    const permissions = getUserPermissions(user.role)
    req.user = { ...user, permissions }

    next()
  } catch (error: any) {
    console.error("Authentication error:", error.message)

    let message = "Invalid or expired token"
    if (error.message === "Token has expired") {
      message = "Token has expired, please login again"
    } else if (error.message === "Invalid token") {
      message = "Invalid token format"
    }

    res.status(403).json({
      success: false,
      message,
    })
  }
}

/**
 * Middleware untuk autentikasi admin token dengan role information
 */
export const authenticateAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(" ")[1]

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Admin access token required",
      })
      return
    }

    // Verify admin token menggunakan utility function
    const decoded = verifyAdminToken(token)

    // Get admin from database
    const [admins] = (await db.execute(
      "SELECT id, username, email, full_name, role, is_active, created_at, updated_at FROM admin_users WHERE id = ? AND is_active = TRUE",
      [decoded.id],
    )) as [AdminUser[], any]

    if (admins.length === 0) {
      res.status(401).json({
        success: false,
        message: "Admin not found or token invalid",
      })
      return
    }

    const admin = admins[0]

    // Add permissions to admin object
    const permissions = getAdminPermissions(admin.role)
    req.admin = { ...admin, permissions }

    next()
  } catch (error: any) {
    console.error("Admin authentication error:", error.message)

    let message = "Invalid or expired admin token"
    if (error.message === "Admin token has expired") {
      message = "Admin token has expired, please login again"
    } else if (error.message === "Invalid admin token") {
      message = "Invalid admin token format"
    }

    res.status(403).json({
      success: false,
      message,
    })
  }
}

/**
 * Middleware untuk dual authentication (user atau admin)
 */
export const authenticateAny = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(" ")[1]

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Access token required",
    })
    return
  }

  try {
    // Try user token first
    const userDecoded = verifyToken(token)
    const [users] = (await db.execute(
      "SELECT id, name, email, role, phone, gender, birth_date, address, is_verified, created_at, updated_at FROM users WHERE id = ?",
      [userDecoded.id],
    )) as [User[], any]

    if (users.length > 0) {
      const user = users[0]
      const permissions = getUserPermissions(user.role)
      req.user = { ...user, permissions }
      next()
      return
    }
  } catch (error) {
    // Try admin token
    try {
      const adminDecoded = verifyAdminToken(token)
      const [admins] = (await db.execute(
        "SELECT id, username, email, full_name, role, is_active, created_at, updated_at FROM admin_users WHERE id = ? AND is_active = TRUE",
        [adminDecoded.id],
      )) as [AdminUser[], any]

      if (admins.length > 0) {
        const admin = admins[0]
        const permissions = getAdminPermissions(admin.role)
        req.admin = { ...admin, permissions }
        next()
        return
      }
    } catch (adminError) {
      // Both failed
    }
  }

  res.status(403).json({
    success: false,
    message: "Invalid or expired token",
  })
}

/**
 * Middleware untuk optional authentication (tidak wajib login)
 */
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(" ")[1]

    if (token) {
      try {
        const decoded = verifyToken(token)
        const [users] = (await db.execute(
          "SELECT id, name, email, role, phone, gender, birth_date, address, is_verified, created_at, updated_at FROM users WHERE id = ?",
          [decoded.id],
        )) as [User[], any]

        if (users.length > 0) {
          const user = users[0]
          const permissions = getUserPermissions(user.role)
          req.user = { ...user, permissions }
        }
      } catch (error) {
        // Try admin token
        try {
          const adminDecoded = verifyAdminToken(token)
          const [admins] = (await db.execute(
            "SELECT id, username, email, full_name, role, is_active, created_at, updated_at FROM admin_users WHERE id = ? AND is_active = TRUE",
            [adminDecoded.id],
          )) as [AdminUser[], any]

          if (admins.length > 0) {
            const admin = admins[0]
            const permissions = getAdminPermissions(admin.role)
            req.admin = { ...admin, permissions }
          }
        } catch (adminError) {
          // Ignore errors for optional auth
        }
      }
    }

    next()
  } catch (error) {
    // Ignore authentication errors for optional auth
    next()
  }
}

/**
 * Middleware untuk memastikan user adalah community member
 */
export const requireCommunityMember = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== "community_member") {
    res.status(403).json({
      success: false,
      message: "Community membership required for this action",
      currentRole: req.user?.role || "none",
      requiredRole: "community_member",
    })
    return
  }
  next()
}

/**
 * Middleware untuk memastikan admin adalah super admin
 */
export const requireSuperAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.admin || req.admin.role !== "super_admin") {
    res.status(403).json({
      success: false,
      message: "Super admin access required",
      currentRole: req.admin?.role || "none",
      requiredRole: "super_admin",
    })
    return
  }
  next()
}
