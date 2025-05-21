require("dotenv").config();
const express = require("express");
const router = express.Router();
const AuthRoutes = require("./auth.routes");
const EventRoutes = require("./event.routes");
const { serveFile } = require("../controllers/file.controller");

router.use("/auth", AuthRoutes);
router.use("/event", EventRoutes);
router.get("/file/:filename", serveFile);

module.exports = router;
