import type { Response, NextFunction } from "express"
import type { UserRole, AdminRole } from "../types"
import type { AuthenticatedRequest } from "./auth"

/**
 * Middleware untuk memeriksa role user
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      })
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
        userRole: req.user.role,
      })
      return
    }

    next()
  }
}

/**
 * Middleware untuk memeriksa role admin
 */
export const requireAdminRole = (allowedRoles: AdminRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: "Admin authentication required",
      })
      return
    }

    if (!allowedRoles.includes(req.admin.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required admin roles: ${allowedRoles.join(", ")}`,
        adminRole: req.admin.role,
      })
      return
    }

    next()
  }
}

/**
 * Middleware untuk user biasa (bukan guest)
 */
export const requireUser = requireRole(["user", "community_member"])

/**
 * Middleware untuk community member
 */
export const requireCommunityMember = requireRole(["community_member"])

/**
 * Middleware untuk admin (semua level)
 */
export const requireAdmin = requireAdminRole(["admin", "super_admin"])

/**
 * Middleware untuk super admin only
 */
export const requireSuperAdmin = requireAdminRole(["super_admin"])

/**
 * Middleware untuk memeriksa apakah user verified
 */
export const requireVerifiedUser = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    })
    return
  }

  if (!req.user.is_verified) {
    res.status(403).json({
      success: false,
      message: "Account verification required",
      isVerified: false,
    })
    return
  }

  next()
}

/**
 * Middleware untuk resource ownership (user dapat akses resource miliknya)
 */
export const requireOwnership = (resourceUserIdField = "user_id") => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      })
      return
    }

    // Check dari params, body, atau query
    const resourceUserId =
      req.params[resourceUserIdField] || req.body[resourceUserIdField] || req.query[resourceUserIdField]

    if (resourceUserId && resourceUserId !== req.user.id) {
      res.status(403).json({
        success: false,
        message: "Access denied. You can only access your own resources",
      })
      return
    }

    next()
  }
}

/**
 * Middleware untuk admin atau owner (admin bisa akses semua, user hanya miliknya)
 */
export const requireAdminOrOwner = (resourceUserIdField = "user_id") => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Jika admin, langsung allow
    if (req.admin) {
      next()
      return
    }

    // Jika user, check ownership
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      })
      return
    }

    const resourceUserId =
      req.params[resourceUserIdField] || req.body[resourceUserIdField] || req.query[resourceUserIdField]

    if (resourceUserId && resourceUserId !== req.user.id) {
      res.status(403).json({
        success: false,
        message: "Access denied. Admin access or resource ownership required",
      })
      return
    }

    next()
  }
}
