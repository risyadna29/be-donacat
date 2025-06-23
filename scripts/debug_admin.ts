import db from "../src/config/database"
import { hashPassword } from "../src/utils/bcrypt"
import { v4 as uuidv4 } from "uuid"

async function debugAdmin() {
  try {
    console.log("🔍 Checking admin_users table...")

    // Cek apakah tabel ada
    const [tables] = (await db.execute("SHOW TABLES LIKE 'admin_users'")) as [any[], any]

    if (tables.length === 0) {
      console.log("❌ Table admin_users does not exist. Creating...")

      await db.execute(`
        CREATE TABLE admin_users (
          id VARCHAR(36) PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          role ENUM('admin', 'super_admin') DEFAULT 'admin',
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `)

      console.log("✅ Table admin_users created")
    }

    // Cek admin yang ada
    const [admins] = (await db.execute("SELECT * FROM admin_users")) as [any[], any]
    console.log("📊 Existing admins:", admins.length)

    if (admins.length > 0) {
      console.log("👥 Admin list:")
      admins.forEach((admin) => {
        console.log(`- ${admin.username} (${admin.role}) - Active: ${admin.is_active}`)
      })
    }

    // Cek apakah debug_admin ada
    const [debugAdmins] = (await db.execute("SELECT * FROM admin_users WHERE username = ?", ["debug_admin"])) as [
      any[],
      any,
    ]

    if (debugAdmins.length === 0) {
      console.log("🔧 Creating debug admin...")

      const hashedPassword = await hashPassword("admin123")
      const adminId = uuidv4()

      await db.execute(
        "INSERT INTO admin_users (id, username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?, ?)",
        [adminId, "debug_admin", "debug@admin.com", hashedPassword, "Debug Administrator", "super_admin"],
      )

      console.log("✅ Debug admin created successfully")
      console.log("📋 Credentials:")
      console.log("   Username: debug_admin")
      console.log("   Password: admin123")
    } else {
      console.log("✅ Debug admin already exists")
      console.log("📋 Credentials:")
      console.log("   Username: debug_admin")
      console.log("   Password: admin123")
    }

    process.exit(0)
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

debugAdmin()
