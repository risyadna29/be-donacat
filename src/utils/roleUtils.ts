import type { UserRole, AdminRole, User, AdminUser } from "../types"

/**
 * Check apakah user memiliki role tertentu
 */
export const hasRole = (user: User, roles: UserRole[]): boolean => {
  return roles.includes(user.role)
}

/**
 * Check apakah admin memiliki role tertentu
 */
export const hasAdminRole = (admin: AdminUser, roles: AdminRole[]): boolean => {
  return roles.includes(admin.role)
}

/**
 * Check apakah user adalah community member
 */
export const isCommunityMember = (user: User): boolean => {
  return user.role === "community_member"
}

/**
 * Check apakah user adalah regular user (bukan guest)
 */
export const isRegularUser = (user: User): boolean => {
  return user.role === "user" || user.role === "community_member"
}

/**
 * Check apakah admin adalah super admin
 */
export const isSuperAdmin = (admin: AdminUser): boolean => {
  return admin.role === "super_admin"
}

/**
 * Get role hierarchy level untuk user
 */
export const getUserRoleLevel = (role: UserRole): number => {
  const roleLevels: Record<UserRole, number> = {
    guest: 0,
    user: 1,
    community_member: 2,
  }
  return roleLevels[role]
}

/**
 * Get role hierarchy level untuk admin
 */
export const getAdminRoleLevel = (role: AdminRole): number => {
  const roleLevels: Record<AdminRole, number> = {
    admin: 1,
    super_admin: 2,
  }
  return roleLevels[role]
}

/**
 * Check apakah user role lebih tinggi atau sama dengan minimum role
 */
export const hasMinimumUserRole = (userRole: UserRole, minimumRole: UserRole): boolean => {
  return getUserRoleLevel(userRole) >= getUserRoleLevel(minimumRole)
}

/**
 * Check apakah admin role lebih tinggi atau sama dengan minimum role
 */
export const hasMinimumAdminRole = (adminRole: AdminRole, minimumRole: AdminRole): boolean => {
  return getAdminRoleLevel(adminRole) >= getAdminRoleLevel(minimumRole)
}

/**
 * Get permissions berdasarkan user role
 */
export const getUserPermissions = (role: UserRole): string[] => {
  const permissions: Record<UserRole, string[]> = {
    guest: ["view_campaigns"],
    user: ["view_campaigns", "create_donation", "view_profile", "update_profile"],
    community_member: [
      "view_campaigns",
      "create_donation",
      "view_profile",
      "update_profile",
      "create_campaign",
      "manage_own_campaigns",
    ],
  }
  return permissions[role]
}

/**
 * Get permissions berdasarkan admin role
 */
export const getAdminPermissions = (role: AdminRole): string[] => {
  const permissions: Record<AdminRole, string[]> = {
    admin: ["view_dashboard", "manage_campaigns", "manage_community_requests", "manage_users", "view_donations"],
    super_admin: [
      "view_dashboard",
      "manage_campaigns",
      "manage_community_requests",
      "manage_users",
      "view_donations",
      "manage_admins",
      "system_settings",
    ],
  }
  return permissions[role]
}

/**
 * Check apakah user memiliki permission tertentu
 */
export const hasUserPermission = (user: User, permission: string): boolean => {
  const userPermissions = getUserPermissions(user.role)
  return userPermissions.includes(permission)
}

/**
 * Check apakah admin memiliki permission tertentu
 */
export const hasAdminPermission = (admin: AdminUser, permission: string): boolean => {
  const adminPermissions = getAdminPermissions(admin.role)
  return adminPermissions.includes(permission)
}

/**
 * Format role untuk display
 */
export const formatUserRole = (role: UserRole): string => {
  const roleLabels: Record<UserRole, string> = {
    guest: "Guest",
    user: "User",
    community_member: "Community Member",
  }
  return roleLabels[role]
}

/**
 * Format admin role untuk display
 */
export const formatAdminRole = (role: AdminRole): string => {
  const roleLabels: Record<AdminRole, string> = {
    admin: "Administrator",
    super_admin: "Super Administrator",
  }
  return roleLabels[role]
}

/**
 * Get role description
 */
export const getUserRoleDescription = (role: UserRole): string => {
  const descriptions: Record<UserRole, string> = {
    guest: "Can view campaigns only",
    user: "Can donate and manage profile",
    community_member: "Can create campaigns and manage community activities",
  }
  return descriptions[role]
}

/**
 * Get admin role description
 */
export const getAdminRoleDescription = (role: AdminRole): string => {
  const descriptions: Record<AdminRole, string> = {
    admin: "Can manage campaigns, users, and community requests",
    super_admin: "Full system access including admin management",
  }
  return descriptions[role]
}
