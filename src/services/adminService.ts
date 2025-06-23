import { v4 as uuidv4 } from "uuid"
import db from "../config/database"
import { hashPassword } from "../utils/bcrypt"
import { AppError } from "../middleware/errorHandler"
import type { CommunityRequestWithUser, CampaignWithUser, UserPublic, AdminPublic, AdminUser, CommunityRequest } from "../types"

export class AdminService {
  async getDashboardStats(): Promise<any> {
    // Get total counts
    const [userStats] = (await db.execute(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'community_member' THEN 1 END) as community_members,
        COUNT(CASE WHEN is_verified = TRUE THEN 1 END) as verified_users
      FROM users
    `)) as [any[], any]

    const [campaignStats] = (await db.execute(`
      SELECT 
        COUNT(*) as total_campaigns,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_campaigns,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_campaigns,
        COALESCE(SUM(current_amount), 0) as total_raised
      FROM campaigns
    `)) as [any[], any]

    const [donationStats] = (await db.execute(`
      SELECT 
        COUNT(*) as total_donations,
        COUNT(CASE WHEN payment_status = 'success' THEN 1 END) as successful_donations,
        COALESCE(SUM(CASE WHEN payment_status = 'success' THEN amount END), 0) as total_donated
      FROM donations
    `)) as [any[], any]

    const [communityStats] = (await db.execute(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_requests
      FROM community_requests
    `)) as [any[], any]

    return {
      users: userStats[0],
      campaigns: campaignStats[0],
      donations: donationStats[0],
      community: communityStats[0],
    }
  }

  async getCommunityRequests(): Promise<CommunityRequestWithUser[]> {
    const [requests] = (await db.execute(`
      SELECT
        cr.*,
        u.name as user_name,
        u.email as user_email
      FROM community_requests cr
      JOIN users u ON cr.user_id = u.id
      WHERE cr.status = 'pending'
      ORDER BY cr.created_at DESC
    `)) as [CommunityRequestWithUser[], any]

    return requests
  }

  async reviewCommunityRequest(
    requestId: string,
    status: "approved" | "rejected",
    adminNotes: string,
  ): Promise<CommunityRequest> {
    const connection = await db.getConnection()
    await connection.beginTransaction()

    try {
      // 1. Get the request and lock the row
      const [requests] = (await connection.execute(
        "SELECT * FROM community_requests WHERE id = ? AND status = 'pending' FOR UPDATE",
        [requestId],
      )) as [CommunityRequest[], any]

      if (requests.length === 0) {
        throw new AppError("Request not found or has already been processed", 404)
      }
      const request = requests[0]

      // 2. Update the request status
      await connection.execute(
        "UPDATE community_requests SET status = ?, admin_notes = ? WHERE id = ?",
        [status, adminNotes, requestId],
      )

      // 3. If approved, update the user's role
      if (status === "approved") {
        await connection.execute("UPDATE users SET role = 'community_member' WHERE id = ?", [request.user_id])
      }

      await connection.commit()

      const [updatedRequest] = (await db.execute("SELECT * FROM community_requests WHERE id = ?", [
        requestId,
      ])) as [CommunityRequest[], any]

      return updatedRequest[0]
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  async getAllCampaigns(): Promise<CampaignWithUser[]> {
    const [campaigns] = (await db.execute(`
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email,
        COUNT(d.id) as total_donations,
        COUNT(CASE WHEN d.payment_status = 'success' THEN 1 END) as successful_donations,
        DATEDIFF(c.deadline, CURDATE()) as days_remaining
      FROM campaigns c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN donations d ON c.id = d.campaign_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `)) as [CampaignWithUser[], any]

    return campaigns
  }

  async reviewCampaign(
    campaignId: string,
    adminId: string,
    status: string,
    adminNotes?: string,
  ): Promise<CampaignWithUser> {
    // FIX: Handle undefined values
    const safeAdminNotes = adminNotes === undefined ? null : adminNotes

    await db.execute(
      `UPDATE campaigns 
       SET status = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, safeAdminNotes, adminId, campaignId],
    )

    const [campaigns] = (await db.execute(
      `SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email,
        COUNT(d.id) as total_donations,
        COUNT(CASE WHEN d.payment_status = 'success' THEN 1 END) as successful_donations,
        DATEDIFF(c.deadline, CURDATE()) as days_remaining
      FROM campaigns c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN donations d ON c.id = d.campaign_id
      WHERE c.id = ?
      GROUP BY c.id`,
      [campaignId],
    )) as [CampaignWithUser[], any]

    if (campaigns.length === 0) {
      throw new AppError("Campaign not found", 404)
    }

    return campaigns[0]
  }

  async getAllUsers(): Promise<UserPublic[]> {
    const [users] = (await db.execute(`
      SELECT id, name, email, phone, gender, birth_date, address, role, is_verified, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `)) as [UserPublic[], any]

    return users
  }

  async updateUserStatus(userId: string, isVerified: boolean): Promise<UserPublic> {
    await db.execute("UPDATE users SET is_verified = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [
      isVerified,
      userId,
    ])

    const [users] = (await db.execute(
      "SELECT id, name, email, phone, gender, birth_date, address, role, is_verified, created_at, updated_at FROM users WHERE id = ?",
      [userId],
    )) as [UserPublic[], any]

    if (users.length === 0) {
      throw new AppError("User not found", 404)
    }

    return users[0]
  }

  // NEW: Update user role
  async updateUserRole(userId: string, role: string): Promise<UserPublic> {
    // Validate role
    const validRoles = ["user", "community_member"]
    if (!validRoles.includes(role)) {
      throw new AppError("Invalid role. Must be 'user' or 'community_member'", 400)
    }

    await db.execute("UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [role, userId])

    const [users] = (await db.execute(
      "SELECT id, name, email, phone, gender, birth_date, address, role, is_verified, created_at, updated_at FROM users WHERE id = ?",
      [userId],
    )) as [UserPublic[], any]

    if (users.length === 0) {
      throw new AppError("User not found", 404)
    }

    return users[0]
  }

  async getAllAdmins(): Promise<AdminPublic[]> {
    const [admins] = (await db.execute(`
      SELECT id, username, email, full_name, role, is_active, created_at, updated_at
      FROM admin_users
      ORDER BY created_at DESC
    `)) as [AdminPublic[], any]

    return admins
  }

  async createAdmin(adminData: any): Promise<AdminPublic> {
    const { username, email, password, full_name, role } = adminData

    // Check if admin already exists
    const [existingAdmins] = (await db.execute("SELECT id FROM admin_users WHERE username = ? OR email = ?", [
      username,
      email,
    ])) as [AdminUser[], any]

    if (existingAdmins.length > 0) {
      throw new AppError("Admin already exists with this username or email", 409)
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create admin
    const adminId = uuidv4()
    await db.execute(
      "INSERT INTO admin_users (id, username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?, ?)",
      [adminId, username, email, hashedPassword, full_name, role],
    )

    // Get created admin
    const [admins] = (await db.execute(
      "SELECT id, username, email, full_name, role, is_active, created_at FROM admin_users WHERE id = ?",
      [adminId],
    )) as [AdminPublic[], any]

    return admins[0]
  }

  async updateAdmin(adminId: string, updateData: any): Promise<AdminPublic> {
    const updateFields: string[] = []
    const updateValues: any[] = []

    // Build dynamic update query
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== "id" && key !== "password") {
        updateFields.push(`${key} = ?`)
        updateValues.push(value)
      }
    })

    if (updateData.password) {
      const hashedPassword = await hashPassword(updateData.password)
      updateFields.push("password = ?")
      updateValues.push(hashedPassword)
    }

    if (updateFields.length === 0) {
      throw new AppError("No fields to update", 400)
    }

    updateValues.push(adminId)

    await db.execute(
      `UPDATE admin_users SET ${updateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues,
    )

    const [admins] = (await db.execute(
      "SELECT id, username, email, full_name, role, is_active, created_at, updated_at FROM admin_users WHERE id = ?",
      [adminId],
    )) as [AdminPublic[], any]

    if (admins.length === 0) {
      throw new AppError("Admin not found", 404)
    }

    return admins[0]
  }
}
