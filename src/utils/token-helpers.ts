/**
 * Helper utilities untuk token management
 */

import { generateToken, generateRefreshToken, verifyRefreshToken } from "./jwt"
import type { JwtPayload } from "../types"

// Type untuk payload tanpa iat dan exp
type UserTokenPayload = Omit<JwtPayload, "iat" | "exp" | "iss" | "aud">

// Token Response Types
export interface TokenResponse {
  access_token: string
  refresh_token?: string
  token_type: "Bearer"
  expires_in: number
}

export interface RefreshTokenRequest {
  refresh_token: string
}

/**
 * Generate token pair (access + refresh)
 * @param payload - User data untuk token
 * @returns Object dengan access dan refresh token
 */
export const generateTokenPair = (payload: UserTokenPayload): TokenResponse => {
  const accessToken = generateToken(payload)
  const refreshToken = generateRefreshToken(payload)

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: "Bearer",
    expires_in: 24 * 60 * 60, // 24 hours in seconds
  }
}

/**
 * Refresh access token menggunakan refresh token
 * @param refreshToken - Refresh token string
 * @returns New token pair
 */
export const refreshAccessToken = (refreshToken: string): TokenResponse => {
  try {
    const decoded = verifyRefreshToken(refreshToken)

    const newPayload: UserTokenPayload = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    }

    return generateTokenPair(newPayload)
  } catch (error) {
    throw new Error("Invalid refresh token")
  }
}

/**
 * Parse Authorization header
 * @param authHeader - Authorization header value
 * @returns Token string atau null
 */
export const parseAuthHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null

  const parts = authHeader.split(" ")
  if (parts.length !== 2 || parts[0] !== "Bearer") return null

  return parts[1]
}

/**
 * Format token untuk response
 * @param token - Token string
 * @returns Formatted token object
 */
export const formatTokenResponse = (token: string): { token: string; type: string } => {
  return {
    token,
    type: "Bearer",
  }
}

/**
 * Extract token dari berbagai format
 * @param authValue - Authorization value (dengan atau tanpa "Bearer ")
 * @returns Clean token string
 */
export const extractToken = (authValue: string): string => {
  if (authValue.startsWith("Bearer ")) {
    return authValue.substring(7)
  }
  return authValue
}

/**
 * Validate token format
 * @param token - Token string
 * @returns Boolean apakah format valid
 */
export const isValidTokenFormat = (token: string): boolean => {
  if (!token || typeof token !== "string") return false

  // JWT format: header.payload.signature
  const parts = token.split(".")
  return parts.length === 3 && parts.every((part) => part.length > 0)
}
