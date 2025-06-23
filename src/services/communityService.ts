import { v4 as uuidv4 } from "uuid"
import db from "../config/database"
import { AppError } from "../middleware/errorHandler"
import type { CommunityRequest, JoinCommunityRequest } from "../types"

export class CommunityService {
  async joinCommunity(userId: string, requestData: JoinCommunityRequest, ktpPhoto: string): Promise<CommunityRequest> {
    const { full_name, gender, birth_place, birth_date, ktp_number, reason, data_agreement } = requestData

    // Convert data_agreement from string to boolean
    const dataAgreement = typeof data_agreement === 'string' ? data_agreement === "true" : Boolean(data_agreement)

    // Check if user already has a pending or approved request
    const [existingRequests] = (await db.execute(
      'SELECT id, status FROM community_requests WHERE user_id = ? AND status IN ("pending", "approved")',
      [userId],
    )) as [CommunityRequest[], any]

    if (existingRequests.length > 0) {
      throw new AppError("You already have a pending or approved community request", 409)
    }

    // Check if KTP number is already used
    const [existingKTP] = (await db.execute("SELECT id FROM community_requests WHERE ktp_number = ?", [
      ktp_number,
    ])) as [CommunityRequest[], any]

    if (existingKTP.length > 0) {
      throw new AppError("KTP number already registered", 409)
    }

    const requestId = uuidv4()

    await db.execute(
      `
      INSERT INTO community_requests (
        id, user_id, full_name, gender, birth_place, birth_date, 
        ktp_number, ktp_photo, reason, data_agreement
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        requestId,
        userId,
        full_name,
        gender,
        birth_place,
        birth_date,
        ktp_number,
        ktpPhoto,
        reason,
        dataAgreement,
      ],
    )

    const [requests] = (await db.execute("SELECT * FROM community_requests WHERE id = ?", [requestId])) as [
      CommunityRequest[],
      any,
    ]

    return requests[0]
  }

  async getCommunityStatus(userId: string): Promise<any> {
    const [user] = (await db.execute("SELECT role FROM users WHERE id = ?", [userId])) as [any[], any]

    if (user.length === 0) {
      throw new AppError("User not found", 404)
    }

    const [request] = (await db.execute(
      "SELECT status, created_at FROM community_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      [userId],
    )) as [any[], any]

    return {
      current_role: user[0].role,
      has_request: request.length > 0,
      request_status: request.length > 0 ? request[0].status : null,
      request_date: request.length > 0 ? request[0].created_at : null,
    }
  }

  async getUserRequest(userId: string): Promise<CommunityRequest | null> {
    const [requests] = (await db.execute(
      "SELECT * FROM community_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      [userId],
    )) as [CommunityRequest[], any]

    return requests.length > 0 ? requests[0] : null
  }
}
