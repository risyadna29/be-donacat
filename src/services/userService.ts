import db from "../config/database"
import { comparePassword, hashPassword } from "../utils/bcrypt"
import { AppError } from "../middleware/errorHandler"
import type { User, UserPublic, UpdateProfileRequest, ChangePasswordRequest } from "../types"

export class UserService {
  async getProfile(userId: string): Promise<UserPublic> {
    const [users] = (await db.execute(
      "SELECT id, name, email, phone, gender, birth_date, address, role, created_at, updated_at FROM users WHERE id = ?",
      [userId],
    )) as [UserPublic[], any]

    if (users.length === 0) {
      throw new AppError("User not found", 404)
    }

    return users[0]
  }

  async updateProfile(userId: string, updateData: UpdateProfileRequest): Promise<UserPublic> {
    const updateFields: string[] = []
    const updateValues: any[] = []

    // Build dynamic update query
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        updateFields.push(`${key} = ?`)
        updateValues.push(value)
      }
    })

    if (updateFields.length === 0) {
      throw new AppError("No fields to update", 400)
    }

    updateValues.push(userId)

    await db.execute(
      `UPDATE users SET ${updateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues,
    )

    return this.getProfile(userId)
  }

  async changePassword(userId: string, passwordData: ChangePasswordRequest): Promise<void> {
    const { currentPassword, newPassword } = passwordData

    // Get current user
    const [users] = (await db.execute("SELECT password FROM users WHERE id = ?", [userId])) as [User[], any]

    if (users.length === 0) {
      throw new AppError("User not found", 404)
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, users[0].password)
    if (!isValidPassword) {
      throw new AppError("Current password is incorrect", 400)
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password
    await db.execute("UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [
      hashedPassword,
      userId,
    ])
  }

  async getUserStats(userId: string): Promise<any> {
    // Get donation stats
    const [donationStats] = (await db.execute(
      `
      SELECT 
        COUNT(*) as total_donations,
        COALESCE(SUM(amount), 0) as total_donated,
        COUNT(CASE WHEN payment_status = 'success' THEN 1 END) as successful_donations
      FROM donations 
      WHERE user_id = ?
    `,
      [userId],
    )) as [any[], any]

    // Get campaign stats (if user is community member)
    const [campaignStats] = (await db.execute(
      `
      SELECT 
        COUNT(*) as total_campaigns,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_campaigns,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_campaigns,
        COALESCE(SUM(current_amount), 0) as total_raised
      FROM campaigns 
      WHERE user_id = ?
    `,
      [userId],
    )) as [any[], any]

    return {
      donations: donationStats[0],
      campaigns: campaignStats[0],
    }
  }
}
