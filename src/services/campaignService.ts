import { v4 as uuidv4 } from "uuid"
import db from "../config/database"
import { AppError } from "../middleware/errorHandler"
import type { Campaign, CreateCampaignRequest, CampaignWithUser } from "../types"

export class CampaignService {
  async getAllCampaigns(): Promise<CampaignWithUser[]> {
    const [campaigns] = (await db.execute(`
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email,
        COALESCE(donation_stats.total_donations, 0) as total_donations,
        COALESCE(donation_stats.successful_donations, 0) as successful_donations,
        DATEDIFF(c.deadline, CURDATE()) as days_remaining
      FROM campaigns c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN (
        SELECT 
          campaign_id,
          COUNT(*) as total_donations,
          COUNT(CASE WHEN payment_status = 'success' THEN 1 END) as successful_donations
        FROM donations 
        GROUP BY campaign_id
      ) donation_stats ON c.id = donation_stats.campaign_id
      WHERE c.status = 'active'
      ORDER BY c.created_at DESC
    `)) as [CampaignWithUser[], any]

    return campaigns
  }

  async getFeaturedCampaigns(): Promise<CampaignWithUser[]> {
    const [campaigns] = (await db.execute(`
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email,
        COALESCE(donation_stats.total_donations, 0) as total_donations,
        COALESCE(donation_stats.successful_donations, 0) as successful_donations,
        DATEDIFF(c.deadline, CURDATE()) as days_remaining
      FROM campaigns c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN (
        SELECT 
          campaign_id,
          COUNT(*) as total_donations,
          COUNT(CASE WHEN payment_status = 'success' THEN 1 END) as successful_donations
        FROM donations 
        GROUP BY campaign_id
      ) donation_stats ON c.id = donation_stats.campaign_id
      WHERE c.status = 'active'
      ORDER BY c.current_amount DESC, c.created_at DESC
      LIMIT 6
    `)) as [CampaignWithUser[], any]

    return campaigns
  }

  async getCampaignById(campaignId: string): Promise<CampaignWithUser> {
    const [campaigns] = (await db.execute(
      `
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email,
        COALESCE(donation_stats.total_donations, 0) as total_donations,
        COALESCE(donation_stats.successful_donations, 0) as successful_donations,
        DATEDIFF(c.deadline, CURDATE()) as days_remaining
      FROM campaigns c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN (
        SELECT 
          campaign_id,
          COUNT(*) as total_donations,
          COUNT(CASE WHEN payment_status = 'success' THEN 1 END) as successful_donations
        FROM donations 
        GROUP BY campaign_id
      ) donation_stats ON c.id = donation_stats.campaign_id
      WHERE c.id = ?
    `,
      [campaignId],
    )) as [CampaignWithUser[], any]

    if (campaigns.length === 0) {
      throw new AppError("Campaign not found", 404)
    }

    return campaigns[0]
  }

  async getUserCampaigns(userId: string): Promise<CampaignWithUser[]> {
    const [campaigns] = (await db.execute(
      `
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email,
        COALESCE(donation_stats.total_donations, 0) as total_donations,
        COALESCE(donation_stats.successful_donations, 0) as successful_donations,
        DATEDIFF(c.deadline, CURDATE()) as days_remaining
      FROM campaigns c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN (
        SELECT 
          campaign_id,
          COUNT(*) as total_donations,
          COUNT(CASE WHEN payment_status = 'success' THEN 1 END) as successful_donations
        FROM donations 
        GROUP BY campaign_id
      ) donation_stats ON c.id = donation_stats.campaign_id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `,
      [userId],
    )) as [CampaignWithUser[], any]

    return campaigns
  }

  async createCampaign(
    userId: string,
    campaignData: CreateCampaignRequest,
    imageFilename: string,
  ): Promise<Campaign> {
    const { title, description, location, category, target_amount, deadline, bank_account } = campaignData;

    const campaignId = uuidv4();

    await db.execute(
      `
      INSERT INTO campaigns (
        id, user_id, title, description, location, category, 
        target_amount, deadline, bank_account, image, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `,
      [
        campaignId,
        userId,
        title,
        description,
        location,
        category,
        target_amount,
        deadline,
        bank_account,
        imageFilename,
      ],
    );

    const [campaigns] = (await db.execute("SELECT * FROM campaigns WHERE id = ?", [campaignId])) as [Campaign[], any];

    return campaigns[0];
  }

  async updateCampaign(campaignId: string, userId: string, updateData: any): Promise<Campaign> {
    // Check if campaign belongs to user
    const [existingCampaigns] = (await db.execute("SELECT id FROM campaigns WHERE id = ? AND user_id = ?", [
      campaignId,
      userId,
    ])) as [Campaign[], any]

    if (existingCampaigns.length === 0) {
      throw new AppError("Campaign not found or access denied", 404)
    }

    const updateFields: string[] = []
    const updateValues: any[] = []

    // Build dynamic update query
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== "id") {
        updateFields.push(`${key} = ?`)
        updateValues.push(value)
      }
    })

    if (updateFields.length === 0) {
      throw new AppError("No fields to update", 400)
    }

    updateValues.push(campaignId)

    await db.execute(
      `UPDATE campaigns SET ${updateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues,
    )

    const [campaigns] = (await db.execute("SELECT * FROM campaigns WHERE id = ?", [campaignId])) as [Campaign[], any]

    return campaigns[0]
  }
}
