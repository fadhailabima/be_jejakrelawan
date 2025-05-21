const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");

async function seeder() {
  try {
    const hashedPassword1 = await bcrypt.hash("password123", 10);

    const users = await prisma.user.createMany({
      data: [
        {
          nama: "Admin",
          email: "admin@example.com",
          password: hashedPassword1,
          role: "Admin",
        },
      ],
    });

    const skills = await prisma.skill.createMany({
      data: [
        { name: "#KebersihanLingkungan" },
        { name: "#DistribusiBantuan" },
        { name: "#PendampingLansia" },
        { name: "#PendidikanAnak" },
        { name: "#Evakuasi" },
        { name: "#PenggalanganDana" },
        { name: "#Komunikasi" },
        { name: "#KesehatanDasar" },
      ],
    });

    console.log("Seeding success: Users added");
  } catch (error) {
    console.error("Failed to seed database", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seeder();
