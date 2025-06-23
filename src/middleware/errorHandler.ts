import type { Request, Response, NextFunction } from "express"
import type { ApiResponse } from "../types"

export interface CustomError extends Error {
  statusCode?: number
  code?: string
}

export const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction): void => {
  console.error("Error:", err)

  let statusCode = err.statusCode || 500
  let message = err.message || "Internal Server Error"

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400
    message = "Validation Error"
  }

  if (err.code === "ER_DUP_ENTRY") {
    statusCode = 409
    message = "Duplicate entry error"
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401
    message = "Invalid token"
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401
    message = "Token expired"
  }

  const response: ApiResponse = {
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  }

  res.status(statusCode).json(response)
}

export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}
