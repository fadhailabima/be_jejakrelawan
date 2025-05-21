const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getUserByEmail = async (email) => {
  return await prisma.user.findFirst({
    where: {
      email: email,
    },
  });
};

const updateUserTokens = async (userId, accessToken, refreshToken) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { accessToken, refreshToken },
  });
};

const createUser = async (userData, skillIds) => {
  // Validasi skillIds untuk memastikan skill ada di database
  const validSkills = await prisma.skill.findMany({
    where: {
      id: { in: skillIds },
    },
    select: { id: true },
  });

  const validSkillIds = validSkills.map((skill) => skill.id);

  if (validSkillIds.length !== skillIds.length) {
    throw new Error("Some skill IDs do not exist in the database.");
  }

  // Buat user dan hubungkan dengan skill melalui UserSkill
  return await prisma.user.create({
    data: {
      ...userData,
      skills: {
        create: validSkillIds.map((skillId) => ({
          skillId: skillId, // Gunakan `skillId` untuk tabel penghubung
        })),
      },
    },
  });
};
const getCurrentUser = async (userId) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      skills: {
        select: {
          name: true,
        },
      },
    },
  });
};
const getUserById = async (id) => {
  return await prisma.user.findUnique({
    where: { id: id },
  });
};

const getLoggedInUser = async (accessToken) => {
  return await prisma.user.findFirst({
    where: { accessToken: accessToken },
    select: {
      id: true,
      email: true,
      nama: true,
      foto: true,
      alamat: true,
      skills: {
        select: {
          skill: {
            // Ikuti relasi ke model Skill
            select: {
              name: true, // Ambil nama skill
            },
          },
        },
      },
      _count: {
        select: {
          volunteers: true, // Menghitung jumlah volunteers
        },
      },
    },
  });
};

module.exports = {
  createUser,
  updateUserTokens,
  getCurrentUser,
  getUserByEmail,
  getUserById,
  getLoggedInUser,
};
