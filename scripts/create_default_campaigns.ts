import db from "../src/config/database"
import { v4 as uuidv4 } from "uuid"

async function createDefaultCampaigns() {
  try {
    console.log("🔍 Creating default campaigns...")

    // Get a community member user to assign campaigns to
    const [users] = (await db.execute("SELECT id FROM users WHERE role = 'community_member' LIMIT 1")) as [any[], any]

    if (users.length === 0) {
      console.log("❌ No community member found. Please run 'npm run create:community-user' first.")
      process.exit(1)
    }

    const userId = users[0].id

    // Check if default campaigns already exist
    const [existingCampaigns] = (await db.execute("SELECT COUNT(*) as count FROM campaigns WHERE title LIKE '%Default Campaign%'")) as [any[], any]

    if (existingCampaigns[0].count > 0) {
      console.log("✅ Default campaigns already exist")
      return
    }

    const defaultCampaigns = [
      {
        title: "Default Campaign 1 - Medical Care for Street Cats",
        description: "Kampanye untuk membantu kucing liar yang membutuhkan perawatan medis. Banyak kucing di jalanan yang terluka atau sakit dan membutuhkan bantuan kita untuk mendapatkan perawatan yang layak. Dana yang terkumpul akan digunakan untuk biaya dokter hewan, obat-obatan, dan perawatan pasca operasi.",
        location: "Jakarta Selatan",
        category: "medical",
        target_amount: 5000000,
        current_amount: 1250000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        bank_account: "1234567890",
        status: "active"
      },
      {
        title: "Default Campaign 2 - Food and Shelter for Abandoned Cats",
        description: "Menyediakan makanan dan tempat tinggal sementara untuk kucing-kucing yang ditinggalkan pemiliknya. Kampanye ini bertujuan untuk memberikan kehidupan yang lebih baik bagi kucing-kucing malang yang tidak memiliki tempat tinggal. Dana akan digunakan untuk membeli makanan berkualitas, membangun shelter, dan biaya operasional harian.",
        location: "Bandung",
        category: "food",
        target_amount: 3000000,
        current_amount: 800000,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        bank_account: "0987654321",
        status: "active"
      },
      {
        title: "Default Campaign 3 - Rescue and Rehabilitation",
        description: "Kampanye penyelamatan dan rehabilitasi kucing-kucing yang berada dalam kondisi kritis. Tim rescue akan melakukan penyelamatan kucing yang terluka parah, memberikan perawatan intensif, dan memastikan mereka pulih dengan baik sebelum dilepas kembali ke habitat yang aman atau diadopsi oleh keluarga yang peduli.",
        location: "Surabaya",
        category: "rescue",
        target_amount: 7500000,
        current_amount: 2100000,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        bank_account: "1122334455",
        status: "active"
      }
    ]

    for (const campaign of defaultCampaigns) {
      const campaignId = uuidv4()
      
      await db.execute(
        `INSERT INTO campaigns (
          id, user_id, title, description, location, category, 
          target_amount, current_amount, deadline, bank_account, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          campaignId,
          userId,
          campaign.title,
          campaign.description,
          campaign.location,
          campaign.category,
          campaign.target_amount,
          campaign.current_amount,
          campaign.deadline,
          campaign.bank_account,
          campaign.status
        ]
      )

      console.log(`✅ Created campaign: ${campaign.title}`)
    }

    console.log("🎉 All default campaigns created successfully!")
    console.log("📋 Campaign details:")
    console.log("   1. Medical Care for Street Cats - Target: Rp 5,000,000")
    console.log("   2. Food and Shelter for Abandoned Cats - Target: Rp 3,000,000")
    console.log("   3. Rescue and Rehabilitation - Target: Rp 7,500,000")

    process.exit(0)
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

createDefaultCampaigns() 