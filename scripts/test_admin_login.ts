import { comparePassword } from "../src/utils/bcrypt"
import db from "../src/config/database"

async function testAdminLogin() {
  try {
    console.log("🧪 Testing admin login process...")

    // 1. Cek apakah admin ada di database
    const [admins] = (await db.execute("SELECT * FROM admin_users WHERE username = ? AND is_active = TRUE", [
      "debug_admin",
    ])) as [any[], any]

    if (admins.length === 0) {
      console.log("❌ Admin not found in database")
      return
    }

    const admin = admins[0]
    console.log("✅ Admin found:", {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      is_active: admin.is_active,
    })

    // 2. Test password comparison
    const testPassword = "admin123"
    const isValidPassword = await comparePassword(testPassword, admin.password)

    console.log("🔐 Password test:")
    console.log("   Input password:", testPassword)
    console.log("   Stored hash:", admin.password.substring(0, 20) + "...")
    console.log("   Password valid:", isValidPassword)

    if (!isValidPassword) {
      console.log("❌ Password does not match!")

      // Reset password
      console.log("🔧 Resetting password...")
      const { hashPassword } = await import("../src/utils/bcrypt")
      const newHashedPassword = await hashPassword("admin123")

      await db.execute("UPDATE admin_users SET password = ? WHERE username = ?", [newHashedPassword, "debug_admin"])

      console.log("✅ Password reset successfully")
    }

    // 3. Test API call
    console.log("🌐 Testing API call...")

    const response = await fetch("http://localhost:3001/api/auth/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "debug_admin",
        password: "admin123",
      }),
    })

    const result = await response.json()
    console.log("📡 API Response:", result)

    if (result.success) {
      console.log("✅ Admin login successful!")
    } else {
      console.log("❌ Admin login failed:", result.message)
    }

    process.exit(0)
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

testAdminLogin()
