const {
  createEvent,
  getAllEvents,
  getAllEventsByUserSkills,
  getEventById,
  createVolunteer,
  getUpcomingEvents,
  updateVolunteerStatusToSelesai,
  createReportFromUpcomingEvents,
} = require("../models/Event");
const authService = require("../services/authService");

const createEventController = async (req, res) => {
  try {
    const {
      title,
      location,
      start_date,
      end_date,
      description,
      requirements,
      organizer,
      point_reward,
      max_volunteers,
      skillIds,
    } = req.body;

    if (
      !title ||
      !location ||
      !start_date ||
      !end_date ||
      !description ||
      !requirements ||
      !organizer ||
      !point_reward ||
      !max_volunteers ||
      !skillIds
    ) {
      return res
        .status(400)
        .json({ error: "All fields are required, including skillIds." });
    }

    if (!req.files || !req.files.image || !req.files.image[0].path) {
      return res.status(400).json({ error: "Image file is required." });
    }

    if (!req.files.organizer_logo || !req.files.organizer_logo[0].path) {
      return res
        .status(400)
        .json({ error: "Organizer logo file is required." });
    }

    const image_url = req.files.image[0].path;
    const organizer_logo = req.files.organizer_logo[0].path;

    const formattedStartDate = new Date(start_date).toISOString().split("T")[0];
    const formattedEndDate = new Date(end_date).toISOString().split("T")[0];

    const eventData = {
      title,
      location,
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      description,
      requirements,
      organizer,
      point_reward,
      max_volunteers,
      image_url,
      organizer_logo,
    };

    const event = await createEvent(eventData, skillIds);

    res.status(201).json({ message: "Event created successfully", event });
  } catch (error) {
    console.error("Error creating event:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const getAllEventsController = async (req, res) => {
  const userId = req.user.id;
  try {
    const events = await getAllEvents(userId);
    res.status(200).json({ message: "Events fetched successfully", events });
  } catch (error) {
    console.error("Error fetching events:", error.stack); // Log stack trace
    res.status(500).json({
      error: "Failed to fetch events",
      details: error.message, // Sertakan pesan error untuk debugging
    });
  }
};

const getEventsByUserSkillsController = async (req, res) => {
  const userId = req.user.id;
  try {
    const events = await getAllEventsByUserSkills(userId);
    res.status(200).json({ message: "Events fetched successfully", events });
  } catch (error) {
    console.error("Error fetching events by user skills:", error.message);
    res.status(500).json({ error: "Failed to fetch events by user skills" });
  }
};

const getEventByIdController = async (req, res) => {
  const { id } = req.params; // Ambil ID dari parameter URL
  try {
    const event = await getEventById(id); // Panggil fungsi getEventById
    res.status(200).json({ message: "Event fetched successfully", event });
  } catch (error) {
    console.error("Error fetching event by ID:", error.message);
    res
      .status(500)
      .json({ error: "Failed to fetch event by ID", details: error.message });
  }
};

const createVolunteerController = async (req, res) => {
  const { id: eventId } = req.params; // Ambil event ID dari parameter URL
  const accessToken = req.headers.authorization?.split(" ")[1]; // Ambil token dari header

  if (!accessToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const user = await authService.getCurrentUserData(accessToken);
    const userId = user.id;

    const volunteer = await createVolunteer(eventId, userId);
    res
      .status(201)
      .json({ message: "Volunteer created successfully", volunteer });
  } catch (error) {
    console.error("Error creating volunteer:", error.message);
    res
      .status(500)
      .json({ error: "Failed to create volunteer", details: error.message });
  }
};

const getUpcomingEventsController = async (req, res) => {
  const userId = req.user.id;

  try {
    const events = await getUpcomingEvents(userId);
    res.status(200).json({ message: "Events fetched successfully", events });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch events",
      details: error.message,
    });
  }
};

const updateVolunteerStatusToSelesaiController = async (req, res) => {
  const { id: eventId } = req.params;
  const userId = req.user.id;
  try {
    const result = await updateVolunteerStatusToSelesai(
      parseInt(eventId),
      parseInt(userId)
    );

    res.status(200).json(result);
  } catch (error) {
    console.error(
      "Error in updateVolunteerStatusToSelesaiController:",
      error.message
    );
    res.status(500).json({
      error: "Failed to update volunteer status to 'selesai'.",
      details: error.message,
    });
  }
};

const createReportController = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;
  const reportData = req.body;

  try {
    if (req.file && req.file.path) {
      reportData.photo_url = req.file.path;
    }

    const result = await createReportFromUpcomingEvents(
      parseInt(eventId),
      parseInt(userId),
      reportData
    );

    res.status(201).json(result);
  } catch (error) {
    console.error("Error in createReportController:", error.message);
    res.status(500).json({
      error: "Failed to create report.",
      details: error.message,
    });
  }
};

module.exports = {
  createEventController,
  getAllEventsController,
  getEventsByUserSkillsController,
  getEventByIdController,
  createVolunteerController,
  getUpcomingEventsController,
  updateVolunteerStatusToSelesaiController,
  createReportController,
};
