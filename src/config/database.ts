import mysql from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config()

const dbConfig: mysql.PoolOptions = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Risql1234",
  database: process.env.DB_NAME || "be_donacat",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

const pool = mysql.createPool(dbConfig)

// Test database connection
export const testConnection = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection()
    console.log("✅ Database connected successfully")
    connection.release()
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    process.exit(1)
  }
}

export default pool
