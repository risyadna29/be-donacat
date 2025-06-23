import type { SignOptions } from "jsonwebtoken"

// JWT Secret
export const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production"

// Validasi format JWT_EXPIRE
const defaultExpire = "24h"
const rawExpire = process.env.JWT_EXPIRE || defaultExpire

const validateJWTExpire = (expire: string): boolean => {
  return /^(\d+)([smhd])?$/.test(expire) || !isNaN(Number(expire))
}

// Casting JWT_EXPIRE supaya sesuai tipe `SignOptions["expiresIn"]`
export const JWT_EXPIRE = validateJWTExpire(rawExpire)
  ? /^\d+$/.test(rawExpire)
    ? Number(rawExpire)
    : rawExpire
  : defaultExpire

// JWT_CONFIG dengan tipe eksplisit
export const JWT_CONFIG: {
  SECRET: string
  EXPIRE: SignOptions["expiresIn"]
  ISSUER: string
  USER_AUDIENCE: string
  ADMIN_AUDIENCE: string
} = {
  SECRET: JWT_SECRET,
  EXPIRE: JWT_EXPIRE as SignOptions["expiresIn"],
  ISSUER: "cat-donation-api",
  USER_AUDIENCE: "cat-donation-users",
  ADMIN_AUDIENCE: "cat-donation-admins",
}

// Warning .env
if (JWT_SECRET === "your-super-secret-jwt-key-change-this-in-production") {
  console.warn("⚠️  WARNING: Using default JWT_SECRET. Please set JWT_SECRET in environment variables for production!")
}

if (!validateJWTExpire(rawExpire)) {
  console.warn("⚠️  WARNING: Invalid JWT_EXPIRE format. Using default 24h")
}

// Lainnya
export const BCRYPT_ROUNDS: number = 12

export const UPLOAD_LIMITS = {
  FILE_SIZE: 5 * 1024 * 1024, // 5MB
  FIELD_SIZE: 10 * 1024 * 1024, // 10MB
} as const

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const
