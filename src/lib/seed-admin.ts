import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

export async function seedAdmin() {
  const count = await db.user.count()

  if (count === 0) {
    const hashedPassword = await bcrypt.hash("admin123", 10)

    await db.user.create({
      data: {
        username: "admin",
        password: hashedPassword,
        name: "Administrator",
        role: "admin",
        active: true,
      },
    })

    console.log("✅ Default admin user created (username: admin, password: admin123)")
  }
}