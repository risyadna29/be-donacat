/**
 * Utility functions untuk validasi JWT dan security
 */

/**
 * Validate JWT secret strength
 */
export const validateJWTSecret = (secret: string): boolean => {
  if (!secret || secret.length < 32) {
    console.error("❌ JWT_SECRET must be at least 32 characters long for security!")
    return false
  }

  if (secret === "your-super-secret-jwt-key-change-this-in-production") {
    console.warn("⚠️  WARNING: Using default JWT_SECRET! Change this in production!")
    return false
  }

  return true
}

/**
 * Generate secure random JWT secret
 */
export const generateSecureJWTSecret = (): string => {
  const crypto = require("crypto")
  return crypto.randomBytes(64).toString("hex")
}

/**
 * Validate environment variables
 */
export const validateEnvironment = (): void => {
  const requiredEnvVars = ["DB_HOST", "DB_USER", "DB_NAME"]
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])

  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(", ")}`)
    process.exit(1)
  }

  if (!validateJWTSecret(process.env.JWT_SECRET || "")) {
    console.warn("⚠️  JWT_SECRET validation failed. Please set a secure JWT_SECRET.")
  }
}
