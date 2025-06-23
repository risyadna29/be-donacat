import type { Request, Response } from "express"
import { StatsService } from "../services/statsService"
import type { ApiResponse } from "../types"

export class StatsController {
  private statsService: StatsService

  constructor() {
    this.statsService = new StatsService()
  }

  async getImpactStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.statsService.getImpactStats()

      const response: ApiResponse = {
        success: true,
        message: "Impact stats retrieved successfully",
        data: stats,
      }

      res.json(response)
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message || "Failed to get impact stats",
        error: error.message,
      }

      res.status(error.statusCode || 500).json(response)
    }
  }
} 