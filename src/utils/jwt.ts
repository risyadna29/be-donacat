import jwt, { type SignOptions } from "jsonwebtoken"
import type { JwtPayload, AdminJwtPayload } from "../types"
import { JWT_CONFIG } from "../config/constants"

// Type untuk payload tanpa iat dan exp
type UserTokenPayload = Omit<JwtPayload, "iat" | "exp" | "iss" | "aud">
type AdminTokenPayload = Omit<AdminJwtPayload, "iat" | "exp" | "iss" | "aud">

/**
 * Generate JWT token untuk user
 * @param payload - User data untuk token
 * @returns JWT token string
 */
export const generateToken = (payload: UserTokenPayload): string => {
  try {
    const signOptions: SignOptions = {
      expiresIn: JWT_CONFIG.EXPIRE,
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.USER_AUDIENCE,
    }

    return jwt.sign(payload as Record<string, any>, JWT_CONFIG.SECRET, signOptions)
  } catch (error) {
    console.error("Error generating user token:", error)
    throw new Error("Failed to generate authentication token")
  }
}

/**
 * Generate JWT token untuk admin
 * @param payload - Admin data untuk token
 * @returns JWT token string
 */
export const generateAdminToken = (payload: AdminTokenPayload): string => {
  try {
    const signOptions: SignOptions = {
      expiresIn: JWT_CONFIG.EXPIRE,
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.ADMIN_AUDIENCE,
    }

    return jwt.sign(payload as Record<string, any>, JWT_CONFIG.SECRET, signOptions)
  } catch (error) {
    console.error("Error generating admin token:", error)
    throw new Error("Failed to generate admin authentication token")
  }
}

/**
 * Verify dan decode user JWT token
 * @param token - JWT token string
 * @returns Decoded JWT payload
 */
export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.SECRET, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.USER_AUDIENCE,
    })

    return decoded as JwtPayload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token has expired")
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token")
    } else if (error instanceof jwt.NotBeforeError) {
      throw new Error("Token not active yet")
    } else {
      throw new Error("Token verification failed")
    }
  }
}

/**
 * Verify dan decode admin JWT token
 * @param token - JWT token string
 * @returns Decoded admin JWT payload
 */
export const verifyAdminToken = (token: string): AdminJwtPayload => {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.SECRET, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.ADMIN_AUDIENCE,
    })

    return decoded as AdminJwtPayload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Admin token has expired")
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid admin token")
    } else if (error instanceof jwt.NotBeforeError) {
      throw new Error("Admin token not active yet")
    } else {
      throw new Error("Admin token verification failed")
    }
  }
}

/**
 * Verify token tanpa audience check (untuk flexibility)
 * @param token - JWT token string
 * @returns Decoded JWT payload
 */
export const verifyTokenFlexible = (token: string): JwtPayload | AdminJwtPayload => {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.SECRET, {
      issuer: JWT_CONFIG.ISSUER,
    })

    return decoded as JwtPayload | AdminJwtPayload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token has expired")
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token")
    } else {
      throw new Error("Token verification failed")
    }
  }
}

/**
 * Decode token tanpa verifikasi (untuk debugging)
 * @param token - JWT token string
 * @returns Decoded payload atau null
 */
export const decodeToken = (token: string): any => {
  try {
    return jwt.decode(token, { complete: false })
  } catch (error) {
    console.error("Error decoding token:", error)
    return null
  }
}

/**
 * Decode token dengan informasi lengkap
 * @param token - JWT token string
 * @returns Decoded token dengan header dan payload
 */
export const decodeTokenComplete = (token: string): any => {
  try {
    return jwt.decode(token, { complete: true })
  } catch (error) {
    console.error("Error decoding token:", error)
    return null
  }
}

/**
 * Check apakah token akan expire dalam waktu tertentu
 * @param token - JWT token string
 * @param minutesBeforeExpiry - Menit sebelum expiry (default: 5)
 * @returns Boolean apakah token akan expire
 */
export const isTokenExpiringSoon = (token: string, minutesBeforeExpiry = 5): boolean => {
  try {
    const decoded = jwt.decode(token) as any
    if (!decoded || !decoded.exp) return true

    const expiryTime = decoded.exp * 1000 // Convert to milliseconds
    const currentTime = Date.now()
    const timeUntilExpiry = expiryTime - currentTime
    const minutesUntilExpiry = timeUntilExpiry / (1000 * 60)

    return minutesUntilExpiry <= minutesBeforeExpiry
  } catch (error) {
    return true
  }
}

/**
 * Get token expiry time
 * @param token - JWT token string
 * @returns Date object atau null
 */
export const getTokenExpiry = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as any
    if (!decoded || !decoded.exp) return null

    return new Date(decoded.exp * 1000)
  } catch (error) {
    return null
  }
}

/**
 * Check apakah token sudah expired
 * @param token - JWT token string
 * @returns Boolean apakah token expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as any
    if (!decoded || !decoded.exp) return true

    const expiryTime = decoded.exp * 1000
    const currentTime = Date.now()

    return currentTime >= expiryTime
  } catch (error) {
    return true
  }
}

/**
 * Refresh token jika mendekati expiry
 * @param token - Current JWT token
 * @param payload - Payload untuk token baru
 * @returns Token baru atau token lama jika belum perlu refresh
 */
export const refreshTokenIfNeeded = (token: string, payload: UserTokenPayload): string => {
  if (isTokenExpiringSoon(token, 30)) {
    // Refresh 30 menit sebelum expire
    return generateToken(payload)
  }
  return token
}

/**
 * Extract user ID dari token tanpa full verification
 * @param token - JWT token string
 * @returns User ID atau null
 */
export const extractUserIdFromToken = (token: string): string | null => {
  try {
    const decoded = jwt.decode(token) as any
    return decoded?.id || null
  } catch (error) {
    return null
  }
}

/**
 * Generate token dengan custom expiry
 * @param payload - User data untuk token
 * @param customExpiry - Custom expiry time (menggunakan tipe yang sama dengan SignOptions)
 * @returns JWT token string
 */
export const generateTokenWithCustomExpiry = (
  payload: UserTokenPayload,
  customExpiry: SignOptions["expiresIn"],
): string => {
  try {
    const signOptions: SignOptions = {
      expiresIn: customExpiry,
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.USER_AUDIENCE,
    }

    return jwt.sign(payload as Record<string, any>, JWT_CONFIG.SECRET, signOptions)
  } catch (error) {
    console.error("Error generating custom token:", error)
    throw new Error("Failed to generate custom authentication token")
  }
}

/**
 * Generate refresh token (longer expiry)
 * @param payload - User data untuk token
 * @returns JWT refresh token string
 */
export const generateRefreshToken = (payload: UserTokenPayload): string => {
  try {
    const signOptions: SignOptions = {
      expiresIn: "7d" as SignOptions["expiresIn"], // Explicit cast
      issuer: JWT_CONFIG.ISSUER,
      audience: `${JWT_CONFIG.USER_AUDIENCE}-refresh`,
    }

    return jwt.sign({ ...payload, type: "refresh" } as Record<string, any>, JWT_CONFIG.SECRET, signOptions)
  } catch (error) {
    console.error("Error generating refresh token:", error)
    throw new Error("Failed to generate refresh token")
  }
}

/**
 * Verify refresh token
 * @param token - Refresh token string
 * @returns Decoded refresh token payload
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.SECRET, {
      issuer: JWT_CONFIG.ISSUER,
      audience: `${JWT_CONFIG.USER_AUDIENCE}-refresh`,
    }) as any

    if (decoded.type !== "refresh") {
      throw new Error("Invalid refresh token type")
    }

    return decoded as JwtPayload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Refresh token has expired")
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid refresh token")
    } else {
      throw new Error("Refresh token verification failed")
    }
  }
}

/**
 * Generate short-lived token (untuk operasi sensitif)
 * @param payload - User data untuk token
 * @returns JWT token string dengan expiry 15 menit
 */
export const generateShortLivedToken = (payload: UserTokenPayload): string => {
  return generateTokenWithCustomExpiry(payload, "15m")
}

/**
 * Generate long-lived token (untuk remember me)
 * @param payload - User data untuk token
 * @returns JWT token string dengan expiry 30 hari
 */
export const generateLongLivedToken = (payload: UserTokenPayload): string => {
  return generateTokenWithCustomExpiry(payload, "30d")
}

/**
 * Generate admin token dengan custom expiry
 * @param payload - Admin data untuk token
 * @param customExpiry - Custom expiry time
 * @returns JWT admin token string
 */
export const generateAdminTokenWithCustomExpiry = (
  payload: AdminTokenPayload,
  customExpiry: SignOptions["expiresIn"],
): string => {
  try {
    const signOptions: SignOptions = {
      expiresIn: customExpiry,
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.ADMIN_AUDIENCE,
    }

    return jwt.sign(payload as Record<string, any>, JWT_CONFIG.SECRET, signOptions)
  } catch (error) {
    console.error("Error generating custom admin token:", error)
    throw new Error("Failed to generate custom admin authentication token")
  }
}
