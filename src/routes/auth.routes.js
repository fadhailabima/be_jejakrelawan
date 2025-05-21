const express = require("express");
const upload = require("../utils/multer");
const {
  login,
  register,
  refreshAccessToken,
  logout,
  getCurrentUser,
  getProfile,
} = require("../controllers/auth.controller");

const { authenticateToken } = require("../middlewares/role.middleware");

const router = express.Router();

router.post("/login", login);
router.post("/register", upload.single("foto"), register);
router.post("/token", refreshAccessToken);
router.post("/logout", logout);
router.get("/data", authenticateToken, getCurrentUser);
router.get("/profile", authenticateToken, getProfile);

module.exports = router;
