import { v4 as uuidv4 } from "uuid"
import db from "../config/database"
import { AppError } from "../middleware/errorHandler"
import type { Donation, CreateDonationRequest, DonationWithDetails, PaymentStatus } from "../types"

export class DonationService {
  async createDonation(userId: string, donationData: CreateDonationRequest): Promise<Donation> {
    const { campaign_id, amount, payment_method, notes } = donationData

    // Check if campaign exists and is active
    const [campaigns] = (await db.execute('SELECT id, status, current_amount FROM campaigns WHERE id = ? AND status = "active"', [
      campaign_id,
    ])) as [any[], any]

    if (campaigns.length === 0) {
      throw new AppError("Campaign not found or not active", 404)
    }

    const campaign = campaigns[0]
    const donationId = uuidv4()

    // Ensure proper data types
    const currentAmount = Number(campaign.current_amount) || 0
    const donationAmount = Number(amount) || 0
    const newCurrentAmount = currentAmount + donationAmount

    console.log(`🔍 Donation Debug:`)
    console.log(`  - Campaign ID: ${campaign_id}`)
    console.log(`  - Current amount: ${currentAmount} (type: ${typeof currentAmount})`)
    console.log(`  - Donation amount: ${donationAmount} (type: ${typeof donationAmount})`)
    console.log(`  - New current amount: ${newCurrentAmount} (type: ${typeof newCurrentAmount})`)

    // Get a connection for transaction
    const connection = await db.getConnection()

    try {
      // Start transaction
      await connection.beginTransaction()

      // Create donation record with success status
      await connection.execute(
        `
        INSERT INTO donations (
            id, user_id, campaign_id, amount, payment_method, notes, payment_status
          ) VALUES (?, ?, ?, ?, ?, ?, 'success')
      `,
        [donationId, userId, campaign_id, donationAmount, payment_method, notes],
      )

      // Update campaign current_amount immediately
      await connection.execute(
        'UPDATE campaigns SET current_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newCurrentAmount, campaign_id]
      )

      // Verify the update
      const [verifyResult] = await connection.execute('SELECT current_amount FROM campaigns WHERE id = ?', [campaign_id]) as [any[], any]
      const updatedAmount = Number(verifyResult[0]?.current_amount) || 0
      
      console.log(`✅ Update verification:`)
      console.log(`  - Expected: ${newCurrentAmount}`)
      console.log(`  - Actual: ${updatedAmount}`)
      console.log(`  - Match: ${updatedAmount === newCurrentAmount}`)

      // Commit transaction
      await connection.commit()

      const [donations] = (await connection.execute("SELECT * FROM donations WHERE id = ?", [donationId])) as [Donation[], any]

      return donations[0]
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback()
      console.error('❌ Donation creation failed:', error)
      throw error
    } finally {
      // Always release the connection
      connection.release()
    }
  }

  async getUserDonations(userId: string): Promise<DonationWithDetails[]> {
    const [donations] = (await db.execute(
      `
      SELECT 
        d.*,
        c.title as campaign_title,
        c.location as campaign_location,
        c.category as campaign_category,
        u.name as user_name
      FROM donations d
      JOIN campaigns c ON d.campaign_id = c.id
      JOIN users u ON d.user_id = u.id
      WHERE d.user_id = ?
      ORDER BY d.created_at DESC
    `,
      [userId],
    )) as [DonationWithDetails[], any]

    return donations
  }

  async getDonationById(donationId: string, userId: string): Promise<DonationWithDetails> {
    const [donations] = (await db.execute(
      `
      SELECT 
        d.*,
        c.title as campaign_title,
        c.location as campaign_location,
        c.category as campaign_category,
        u.name as user_name
      FROM donations d
      JOIN campaigns c ON d.campaign_id = c.id
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ? AND d.user_id = ?
    `,
      [donationId, userId],
    )) as [DonationWithDetails[], any]

    if (donations.length === 0) {
      throw new AppError("Donation not found", 404)
    }

    return donations[0]
  }

  async updatePaymentStatus(
    donationId: string,
    userId: string,
    paymentStatus: PaymentStatus,
    transactionId?: string,
  ): Promise<Donation> {
    // Check if donation belongs to user
    const [existingDonations] = (await db.execute("SELECT id FROM donations WHERE id = ? AND user_id = ?", [
      donationId,
      userId,
    ])) as [any[], any]

    if (existingDonations.length === 0) {
      throw new AppError("Donation not found or access denied", 404)
    }

    // Update donation payment status
    await db.execute(
      "UPDATE donations SET payment_status = ?, transaction_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [paymentStatus, transactionId, donationId],
    )

    const [donations] = (await db.execute("SELECT * FROM donations WHERE id = ?", [donationId])) as [Donation[], any]

    return donations[0]
  }
}
