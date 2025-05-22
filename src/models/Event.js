const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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

const createEvent = async (eventData, skills) => {
  if (!skills || typeof skills !== "string") {
    throw new Error(
      "Skills must be a non-empty string of comma-separated IDs."
    );
  }

  let skillIds;
  try {
    skillIds = skills.split(",").map((id) => parseInt(id.trim(), 10));
    if (skillIds.some(isNaN)) {
      throw new Error();
    }
  } catch {
    throw new Error(
      "Invalid skills format. Expected a comma-separated list of integers."
    );
  }

  const validSkillIds = await validateSkills(skillIds);

  if (validSkillIds.length !== skillIds.length) {
    throw new Error("Some skill IDs do not exist in the database.");
  }

  // Konversi tanggal ke format ISO-8601
  const startDate = new Date(eventData.start_date);
  const endDate = new Date(eventData.end_date);

  if (isNaN(startDate) || isNaN(endDate)) {
    throw new Error("Invalid date format. Expected ISO-8601 format.");
  }

  const event = await prisma.$transaction(async (tx) => {
    // Buat event
    const createdEvent = await tx.event.create({
      data: {
        title: eventData.title,
        location: eventData.location,
        start_date: startDate, // Gunakan objek Date
        end_date: endDate, // Gunakan objek Date
        description: eventData.description,
        requirements: eventData.requirements,
        organizer: eventData.organizer,
        point_reward: parseInt(eventData.point_reward, 10), // Pastikan integer
        max_volunteers: parseInt(eventData.max_volunteers, 10), // Pastikan integer
        image_url: eventData.image_url,
        organizer_logo: eventData.organizer_logo,
      },
    });

    // Hubungkan event dengan skill melalui EventSkill
    await tx.eventSkill.createMany({
      data: validSkillIds.map((skillId) => ({
        event_id: createdEvent.id,
        skill_id: skillId,
      })),
    });

    return createdEvent;
  });

  return event;
};

const getAllEvents = async (userId) => {
  try {
    const today = new Date(); // Ambil tanggal hari ini

    const todayWIB = new Date(
      today.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );

    const events = await prisma.event.findMany({
      where: {
        start_date: {
          gte: todayWIB, // Filter event dengan start_date >= hari ini
        },
        volunteers: {
          none: {
            user_id: userId, // Filter event di mana user belum menjadi volunteer
          },
        },
      },
      include: {
        skills: {
          select: {
            Skill: {
              select: {
                name: true, // Ambil nama skill
              },
            },
          },
        },
      },
    });

    return events;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw new Error("Failed to fetch events.");
  }
};

const getAllEventsByUserSkills = async (userId) => {
  try {
    const today = new Date(); // Ambil tanggal hari ini

    const todayWIB = new Date(
      today.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );

    // Ambil skill user berdasarkan userId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        skills: {
          select: {
            id: true, // Ambil ID skill user
          },
        },
      },
    });

    if (!user || user.skills.length === 0) {
      throw new Error("User has no skills or does not exist.");
    }

    // Ambil ID skill user
    const userSkillIds = user.skills.map((skill) => skill.id);

    // Ambil event yang memiliki skill yang sama dengan skill user
    const events = await prisma.event.findMany({
      where: {
        start_date: {
          gte: todayWIB, // Filter event dengan start_date >= hari ini
        },
        skills: {
          some: {
            skill_id: {
              in: userSkillIds, // Filter berdasarkan skill user
            },
          },
        },
        volunteers: {
          none: {
            user_id: userId, // Filter event di mana user belum menjadi volunteer
          },
        },
      },
      include: {
        skills: {
          select: {
            Skill: {
              select: {
                name: true, // Ambil nama skill
              },
            },
          },
        },
        _count: {
          select: {
            volunteers: true, // Hitung jumlah volunteers
          },
        },
      },
    });

    return events.map((event) => ({
      ...event,
      volunteerCount: event._count.volunteers, // Tambahkan jumlah volunteers ke hasil
    }));
  } catch (error) {
    console.error("Error fetching events by user skills:", error);
    throw new Error("Failed to fetch events by user skills.");
  }
};

const getEventById = async (eventId) => {
  try {
    // Validasi apakah eventId adalah angka
    const parsedEventId = parseInt(eventId, 10);
    if (isNaN(parsedEventId)) {
      throw new Error("Invalid event ID. Expected a valid integer.");
    }

    // Ambil data event berdasarkan ID
    const event = await prisma.event.findUnique({
      where: { id: parsedEventId },
      include: {
        skills: {
          select: {
            Skill: {
              select: {
                name: true, // Ambil nama skill
              },
            },
          },
        },
        _count: {
          select: {
            volunteers: true, // Hitung jumlah volunteers
          },
        },
      },
    });

    // Jika event tidak ditemukan, lempar error
    if (!event) {
      throw new Error("Event not found.");
    }

    // Tambahkan jumlah volunteers ke hasil
    return {
      ...event,
      volunteerCount: event._count.volunteers,
    };
  } catch (error) {
    console.error("Error fetching event by ID:", error);
    throw new Error("Failed to fetch event by ID.");
  }
};

const createVolunteer = async (eventId, userId) => {
  try {
    // Validasi apakah eventId dan userId adalah angka
    const parsedEventId = parseInt(eventId, 10);
    const parsedUserId = parseInt(userId, 10);

    if (isNaN(parsedEventId) || isNaN(parsedUserId)) {
      throw new Error("Invalid event ID or user ID. Expected valid integers.");
    }

    // Buat data volunteer
    const volunteer = await prisma.volunteer.create({
      data: {
        event_id: parsedEventId,
        user_id: parsedUserId,
        status: "Mendatang", // Status default
      },
    });

    return volunteer;
  } catch (error) {
    console.error("Error creating volunteer:", error);
    throw new Error("Failed to create volunteer.");
  }
};

const getUpcomingEvents = async (userId) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        volunteers: {
          some: {
            user_id: userId,
          },
        },
      },
      include: {
        volunteers: {
          where: {
            user_id: userId,
          },
          select: {
            status: true,
            Reports: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    return events;
  } catch (error) {
    console.error("Error fetching upcoming events:", error.message);
    throw new Error("Failed to fetch upcoming events.");
  }
};

const updateVolunteerStatusToSelesai = async (eventId, userId) => {
  try {
    const updatedVolunteer = await prisma.volunteer.updateMany({
      where: {
        event_id: eventId,
        user_id: userId,
      },
      data: {
        status: "Selesai",
      },
    });

    if (updatedVolunteer.count === 0) {
      throw new Error("No volunteer found for the given eventId and userId.");
    }

    return {
      message: "Volunteer status updated to 'selesai' successfully.",
      updatedCount: updatedVolunteer.count,
    };
  } catch (error) {
    console.error(
      "Error updating volunteer status to 'selesai':",
      error.message
    );
    throw new Error(
      error.message || "Failed to update volunteer status to 'selesai'."
    );
  }
};

const createReportFromUpcomingEvents = async (eventId, userId, reportData) => {
  try {
    const volunteer = await prisma.volunteer.findFirst({
      where: {
        event_id: eventId,
        user_id: userId,
      },
    });

    if (!volunteer) {
      throw new Error("Volunteer not found for the given eventId and userId.");
    }
    const existingReport = await prisma.reports.findFirst({
      where: {
        volunteer_id: volunteer.id,
      },
    });

    if (existingReport) {
      throw new Error("Report already exists for this volunteer.");
    }

    // Buat laporan baru
    const newReport = await prisma.reports.create({
      data: {
        volunteer_id: volunteer.id,
        ...reportData,
      },
    });

    return {
      message: "Report created successfully.",
      report: newReport,
    };
  } catch (error) {
    console.error("Error creating report:", error.message);
    throw new Error(error.message || "Failed to create report.");
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  getAllEventsByUserSkills,
  getEventById,
  createVolunteer,
  getUpcomingEvents,
  updateVolunteerStatusToSelesai,
  createReportFromUpcomingEvents,
};
