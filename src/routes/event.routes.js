const express = require("express");
const upload = require("../utils/multer");
const {
  createEventController,
  getAllEventsController,
  getEventsByUserSkillsController,
  getEventByIdController,
  createVolunteerController,
  getUpcomingEventsController,
  updateVolunteerStatusToSelesaiController,
} = require("../controllers/event.controller");

const { authenticateToken } = require("../middlewares/role.middleware");

const router = express.Router();

router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "organizer_logo", maxCount: 1 },
  ]),
  createEventController
);

router.get("/", authenticateToken, getAllEventsController);
router.get("/user-skills", authenticateToken, getEventsByUserSkillsController);
router.post("/:id/volunteer", authenticateToken, createVolunteerController);
router.get("/upcoming", authenticateToken, getUpcomingEventsController);
router.put(
  "/:id/volunteer/selesai",
  authenticateToken,
  updateVolunteerStatusToSelesaiController
);
router.get("/:id", authenticateToken, getEventByIdController);

module.exports = router;
