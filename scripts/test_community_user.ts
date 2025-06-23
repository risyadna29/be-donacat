import db from "../src/config/database"
import { hashPassword } from "../src/utils/bcrypt"
import { v4 as uuidv4 } from "uuid"

async function createTestCommunityUser() {
  try {
    console.log("🔍 Creating test community member user...")

    // Check if test community user already exists
    const [existingUsers] = (await db.execute("SELECT * FROM users WHERE email = ?", ["community@test.com"])) as [any[], any]

    if (existingUsers.length > 0) {
      console.log("✅ Test community user already exists")
      console.log("📋 Credentials:")
      console.log("   Email: community@test.com")
      console.log("   Password: community123")
      console.log("   Role: community_member")
      return
    }

    // Create test community user
    const hashedPassword = await hashPassword("community123")
    const userId = uuidv4()

    await db.execute(
      "INSERT INTO users (id, name, email, phone, password, role, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [userId, "Test Community User", "community@test.com", "081234567890", hashedPassword, "community_member", true]
    )

    console.log("✅ Test community user created successfully")
    console.log("📋 Credentials:")
    console.log("   Email: community@test.com")
    console.log("   Password: community123")
    console.log("   Role: community_member")

    process.exit(0)
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

createTestCommunityUser()