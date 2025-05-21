const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const {
  getUserByEmail,
  updateUserTokens,
  createUser,
  getCurrentUser,
  getUserById,
  getLoggedInUser,
} = require("../models/User");

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      nama: user.nama,
      role: user.id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "30d" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      nama: user.nama,
      role: user.id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "30d" }
  );
};

const login = async (identifier, password) => {
  const user = await getUserByEmail(identifier);
  if (!user) {
    throw new Error("User not found");
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new Error("Invalid credentials");
  }
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  await updateUserTokens(user.id, accessToken, refreshToken);

  return { accessToken, refreshToken };
};

const validateSkills = async (skillIds) => {
  if (!Array.isArray(skillIds)) {
    throw new Error("Invalid skillIds format. Expected an array of integers.");
  }

  const validSkills = await prisma.skill.findMany({
    where: {
      id: { in: skillIds },
    },
    select: { id: true },
  });

  return validSkills.map((skill) => skill.id);
};

const register = async (data) => {
  const user = await getUserByEmail(data.email);
  if (user) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const { skills } = data;

  // Validasi jika skills tidak ada atau kosong
  if (!skills || typeof skills !== "string") {
    throw new Error(
      "Skills must be a non-empty string of comma-separated IDs."
    );
  }

  let skillIds;
  try {
    // Konversi skills menjadi array integer
    skillIds = skills.split(",").map((id) => parseInt(id.trim(), 10));
    if (skillIds.some(isNaN)) {
      throw new Error();
    }
  } catch {
    throw new Error(
      "Invalid skills format. Expected a comma-separated list of integers."
    );
  }

  // Validasi skill IDs
  const validSkillIds = await validateSkills(skillIds);

  const newUser = await createUser(
    {
      ...data,
      password: hashedPassword,
    },
    validSkillIds // Kirim skill IDs yang valid
  );

  const accessToken = generateAccessToken(newUser);
  const refreshToken = generateRefreshToken(newUser);
  await updateUserTokens(newUser.id, accessToken, refreshToken);

  return { accessToken, refreshToken };
};

const refreshAccessToken = async (refreshToken) => {
  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await getUserById(payload.id);

    if (!user || user.refreshToken !== refreshToken) {
      throw new Error("Invalid refresh token");
    }

    const newAccessToken = generateAccessToken(user);
    await updateUserTokens(user.id, newAccessToken, refreshToken);

    return newAccessToken;
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
};

const getCurrentUserData = async (accessToken) => {
  try {
    const user = await getLoggedInUser(accessToken);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  } catch (error) {
    return { error: error.message }; // Kirimkan pesan error asli
  }
};

const logout = async (userId) => {
  await updateUserTokens(userId, null, null);
};

module.exports = {
  login,
  refreshAccessToken,
  logout,
  register,
  getCurrentUserData,
};
