import db from "../config/database"

export class StatsService {
  async getImpactStats(): Promise<{ activeCampaigns: number; activeDonors: number }> {
    // Get total active campaigns
    const [campaignsResult] = (await db.execute(
      "SELECT COUNT(*) as count FROM campaigns WHERE status = 'active'",
    )) as [any[], any]
    const activeCampaigns = campaignsResult[0].count || 0

    // Get total unique donors from successful donations
    const [donorsResult] = (await db.execute(
      "SELECT COUNT(DISTINCT user_id) as count FROM donations WHERE payment_status = 'success'",
    )) as [any[], any]
    const activeDonors = donorsResult[0].count || 0

    return { activeCampaigns, activeDonors }
  }
} 