const authService = require("../services/authService");
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const { accessToken, refreshToken } = await authService.login(
      identifier,
      password
    );
    const decodedAccessToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );
    const { id, email } = decodedAccessToken;

    res.status(200).json({
      user: { id, email },
      tokens: { accessToken, refreshToken },
      message: "Login berhasil",
    });
  } catch (error) {
    res.status(401).json({ error: error.message || "Login gagal" });
  }
};

const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    if (!refreshToken) {
      throw new Error("Refresh token is required");
    }

    const newAccessToken = await authService.refreshAccessToken(refreshToken);
    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ error: error.message || "Token refresh gagal" });
  }
};

const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Bearer token is required in Authorization header");
    }

    const accessToken = authHeader.split(" ")[1];

    const decodedAccessToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    const userId = decodedAccessToken.id;

    await authService.logout(userId);

    res.status(200).json({ message: "Berhasil Logout" });
  } catch (error) {
    res.status(500).json({ error: error.message || "Logout gagal" });
  }
};

const register = async (req, res) => {
  const userData = req.body;

  try {
    if (req.file && req.file.path) {
      userData.foto = req.file.path;
    }

    const { accessToken, refreshToken } = await authService.register(userData);

    res.status(201).json({
      tokens: { accessToken, refreshToken },
      message: "Register berhasil",
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Register gagal" });
  }
};

const getCurrentUser = async (req, res) => {
  const authHeader = req.headers.authorization;

  try {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Bearer token is required in Authorization header");
    }

    const accessToken = authHeader.split(" ")[1];

    const decodedAccessToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    const userId = decodedAccessToken.id;

    const user = await authService.getCurrentUserData(userId);

    res.status(200).json({ user });
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Gagal mendapatkan data user" });
  }
};

const getProfile = async (req, res) => {
  const accessToken = req.headers.authorization?.split(" ")[1]; // Ambil token dari header
  if (!accessToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const user = await authService.getCurrentUserData(accessToken);
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  login,
  refreshAccessToken,
  logout,
  register,
  getCurrentUser,
  getProfile,
};
