const Appointment = require("../models/Appointment");

const SLOT_LOCK_STATUSES = ["PENDING", "ACCEPTED", "COMPLETED"];

const getDoctorServiceUrl = () => (process.env.DOCTOR_SERVICE_URL || "http://doctor-service:4002").replace(/\/+$/, "");
const getNotificationServiceUrl = () =>
  (process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:4006").replace(/\/+$/, "");

const normalizeString = (value = "") => value.toString().trim();
const normalizeDayName = (value = "") => normalizeString(value).toLowerCase();
const normalizeSlotValue = (value = "") => normalizeString(value).replace(/\s+/g, " ").toUpperCase();
const normalizeDateKey = (value) => {
  if (!value) return "";

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const asText = normalizeString(value);
  if (!asText) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(asText)) {
    return asText;
  }

  const parsed = new Date(asText);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
};

const parseAppointmentDate = (value) => {
  if (!value) return null;

  let rawDate = null;

  if (value instanceof Date) {
    rawDate = new Date(value.getTime());
  } else {
    const asString = normalizeString(value);
    if (!asString) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(asString)) {
      rawDate = new Date(`${asString}T00:00:00.000Z`);
    } else {
      rawDate = new Date(asString);
    }
  }

  if (!rawDate || Number.isNaN(rawDate.getTime())) {
    return null;
  }

  const dayStart = new Date(Date.UTC(rawDate.getUTCFullYear(), rawDate.getUTCMonth(), rawDate.getUTCDate()));
  const dayEnd = new Date(dayStart.getTime());
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  return {
    dayStart,
    dayEnd,
    dateKey: dayStart.toISOString().slice(0, 10),
    dayLabel: dayStart.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }),
    normalizedDate: dayStart
  };
};

const fetchDoctorProfile = async (doctorProfileId) => {
  const response = await fetch(`${getDoctorServiceUrl()}/doctors/${doctorProfileId}`);
  if (!response.ok) {
    return null;
  }
  return response.json();
};

const notifyByEmail = async ({ to, subject, message }) => {
  if (!to) return;

  try {
    const response = await fetch(`${getNotificationServiceUrl()}/notifications/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, message })
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("Notification service returned an error:", {
        status: response.status,
        body
      });
    }
  } catch (error) {
    console.error("Notification send failed:", error.message);
  }
};

const buildJitsiLink = (appointment) => {
  const room = `smart-health-${appointment._id.toString()}`;
  return `https://meet.jit.si/${room}`;
};

const buildDoctorOwnershipFilter = (user) => {
  const or = [{ doctorId: user.id }];

  if (user.email) {
    or.push({ doctorEmail: user.email });
  }

  return or.length === 1 ? or[0] : { $or: or };
};

const getConfiguredSlotsForDate = (doctor, parsedDate) => {
  if (!Array.isArray(doctor?.availability)) return [];

  const targetDateKey = parsedDate.dateKey;
  const targetDay = normalizeDayName(parsedDate.dayLabel);

  const dateEntries = doctor.availability.filter(
    (entry) => normalizeDateKey(entry?.date) === targetDateKey
  );

  const sourceEntries = dateEntries.length > 0
    ? dateEntries
    : doctor.availability.filter((entry) => normalizeDayName(entry?.day) === targetDay);

  const deduped = [];
  const seenSlotKeys = new Set();

  sourceEntries.forEach((entry) => {
    if (!Array.isArray(entry?.slots)) return;

    entry.slots.forEach((slot) => {
      const normalizedSlotText = normalizeString(slot);
      const slotKey = normalizeSlotValue(slot);

      if (!normalizedSlotText || !slotKey || seenSlotKeys.has(slotKey)) {
        return;
      }

      seenSlotKeys.add(slotKey);
      deduped.push(normalizedSlotText);
    });
  });

  return deduped;
};

const getBlockingAppointments = async ({ doctorProfileId, parsedDate, excludeAppointmentId }) => {
  const filter = {
    doctorProfileId: doctorProfileId.toString(),
    appointmentDate: {
      $gte: parsedDate.dayStart,
      $lt: parsedDate.dayEnd
    },
    status: { $in: SLOT_LOCK_STATUSES }
  };

  if (excludeAppointmentId) {
    filter._id = { $ne: excludeAppointmentId };
  }

  return Appointment.find(filter).select("_id timeSlot status").lean();
};

const findSlotConflict = async ({ doctorProfileId, appointmentDate, timeSlot, excludeAppointmentId }) => {
  const parsedDate = parseAppointmentDate(appointmentDate);
  if (!parsedDate) {
    return { error: "appointmentDate must be a valid date" };
  }

  const normalizedSlotText = normalizeString(timeSlot);
  if (!normalizedSlotText) {
    return { error: "timeSlot is required" };
  }

  const slotKey = normalizeSlotValue(normalizedSlotText);
  const blockingAppointments = await getBlockingAppointments({
    doctorProfileId,
    parsedDate,
    excludeAppointmentId
  });

  const conflictingAppointment = blockingAppointments.find(
    (appointment) => normalizeSlotValue(appointment.timeSlot) === slotKey
  );

  return {
    parsedDate,
    normalizedSlotText,
    slotKey,
    conflictingAppointment
  };
};

const validateSlotAgainstDoctorAvailability = ({ doctor, parsedDate, slotKey }) => {
  const configuredSlots = getConfiguredSlotsForDate(doctor, parsedDate);
  const configuredSlotKeys = new Set(configuredSlots.map((slot) => normalizeSlotValue(slot)));

  if (!configuredSlotKeys.has(slotKey)) {
    return {
      valid: false,
      message: `Selected time slot is not available for ${parsedDate.dateKey}`,
      configuredSlots
    };
  }

  return {
    valid: true,
    configuredSlots
  };
};

const getAvailableSlots = async (req, res) => {
  try {
    const { doctorProfileId, appointmentDate } = req.query;

    if (!doctorProfileId || !appointmentDate) {
      return res.status(400).json({ message: "doctorProfileId and appointmentDate are required" });
    }

    const doctor = await fetchDoctorProfile(doctorProfileId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const parsedDate = parseAppointmentDate(appointmentDate);
    if (!parsedDate) {
      return res.status(400).json({ message: "appointmentDate must be a valid date" });
    }

    const configuredSlots = getConfiguredSlotsForDate(doctor, parsedDate);

    if (configuredSlots.length === 0) {
      return res.status(200).json({
        doctorProfileId: doctor._id.toString(),
        appointmentDate: parsedDate.normalizedDate.toISOString().slice(0, 10),
        day: parsedDate.dayLabel,
        availableSlots: [],
        blockedSlots: []
      });
    }

    const blockingAppointments = await getBlockingAppointments({
      doctorProfileId: doctor._id.toString(),
      parsedDate
    });

    const blockedSlotKeys = new Set(
      blockingAppointments.map((appointment) => normalizeSlotValue(appointment.timeSlot)).filter(Boolean)
    );

    const availableSlots = configuredSlots.filter((slot) => !blockedSlotKeys.has(normalizeSlotValue(slot)));
    const blockedSlots = configuredSlots.filter((slot) => blockedSlotKeys.has(normalizeSlotValue(slot)));

    return res.status(200).json({
      doctorProfileId: doctor._id.toString(),
      appointmentDate: parsedDate.normalizedDate.toISOString().slice(0, 10),
      day: parsedDate.dayLabel,
      availableSlots,
      blockedSlots
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching available slots" });
  }
};

const bookAppointment = async (req, res) => {
  try {
    const { doctorProfileId, reason, appointmentDate, timeSlot } = req.body;

    if (!doctorProfileId || !reason || !appointmentDate || !timeSlot) {
      return res.status(400).json({ message: "doctorProfileId, reason, appointmentDate and timeSlot are required" });
    }

    const doctor = await fetchDoctorProfile(doctorProfileId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    if (!doctor.userId) {
      return res.status(400).json({ message: "Doctor profile is missing linked userId" });
    }

    if (doctor.verified === false) {
      return res.status(400).json({ message: "Doctor is not verified yet" });
    }

    const slotCheck = await findSlotConflict({
      doctorProfileId: doctor._id.toString(),
      appointmentDate,
      timeSlot
    });

    if (slotCheck.error) {
      return res.status(400).json({ message: slotCheck.error });
    }

    const availabilityCheck = validateSlotAgainstDoctorAvailability({
      doctor,
      parsedDate: slotCheck.parsedDate,
      slotKey: slotCheck.slotKey
    });

    if (!availabilityCheck.valid) {
      return res.status(400).json({ message: availabilityCheck.message });
    }

    if (slotCheck.conflictingAppointment) {
      return res.status(409).json({ message: "Selected slot is already booked. Please choose another slot." });
    }

    const normalizedDoctorId = doctor.userId.toString().trim();
    const normalizedDoctorEmail = (doctor.email || "").toString().trim().toLowerCase();

    const appointment = await Appointment.create({
      patientId: req.user.id,
      patientName: req.user.name,
      patientEmail: req.user.email,
      doctorId: normalizedDoctorId,
      doctorProfileId: doctor._id.toString(),
      doctorName: doctor.name,
      doctorEmail: normalizedDoctorEmail,
      specialization: doctor.specialization || "",
      consultationFee: Number(doctor.consultationFee || 0),
      reason,
      appointmentDate: slotCheck.parsedDate.normalizedDate,
      timeSlot: slotCheck.normalizedSlotText,
      status: "PENDING"
    });

    void notifyByEmail({
      to: req.user.email,
      subject: "Appointment booked",
      message: `Your appointment request with Dr. ${doctor.name} is now pending.`
    });

    void notifyByEmail({
      to: doctor.email,
      subject: "New appointment request",
      message: `${req.user.name} requested an appointment on ${appointment.timeSlot}, ${appointment.appointmentDate.toDateString()}.`
    });

    return res.status(201).json({
      message: "Appointment booked successfully",
      appointment
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while booking appointment" });
  }
};

const getMyAppointments = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { patientId: req.user.id };

    if (status) {
      filter.status = status;
    }

    const appointments = await Appointment.find(filter).sort({ appointmentDate: -1, createdAt: -1 });
    return res.status(200).json(appointments);
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching appointments" });
  }
};

const getMyAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, patientId: req.user.id });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json(appointment);
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching appointment" });
  }
};

const updateMyAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, patientId: req.user.id });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status !== "PENDING") {
      return res.status(400).json({ message: "Only pending appointments can be modified" });
    }

    if (req.body.reason !== undefined) {
      appointment.reason = req.body.reason;
    }

    const hasDateOrSlotUpdate = req.body.appointmentDate !== undefined || req.body.timeSlot !== undefined;

    if (hasDateOrSlotUpdate) {
      const nextDate = req.body.appointmentDate !== undefined ? req.body.appointmentDate : appointment.appointmentDate;
      const nextSlot = req.body.timeSlot !== undefined ? req.body.timeSlot : appointment.timeSlot;

      const slotCheck = await findSlotConflict({
        doctorProfileId: appointment.doctorProfileId,
        appointmentDate: nextDate,
        timeSlot: nextSlot,
        excludeAppointmentId: appointment._id
      });

      if (slotCheck.error) {
        return res.status(400).json({ message: slotCheck.error });
      }

      const doctor = await fetchDoctorProfile(appointment.doctorProfileId);
      if (!doctor) {
        return res.status(400).json({ message: "Doctor profile not found for this appointment" });
      }

      const availabilityCheck = validateSlotAgainstDoctorAvailability({
        doctor,
        parsedDate: slotCheck.parsedDate,
        slotKey: slotCheck.slotKey
      });

      if (!availabilityCheck.valid) {
        return res.status(400).json({ message: availabilityCheck.message });
      }

      if (slotCheck.conflictingAppointment) {
        return res.status(409).json({ message: "Selected slot is already booked. Please choose another slot." });
      }

      appointment.appointmentDate = slotCheck.parsedDate.normalizedDate;
      appointment.timeSlot = slotCheck.normalizedSlotText;
    }

    await appointment.save();

    return res.status(200).json({
      message: "Appointment updated successfully",
      appointment
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while updating appointment" });
  }
};

const cancelMyAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, patientId: req.user.id });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (["CANCELLED", "COMPLETED"].includes(appointment.status)) {
      return res.status(400).json({ message: `Appointment is already ${appointment.status}` });
    }

    appointment.status = "CANCELLED";
    await appointment.save();

    void notifyByEmail({
      to: appointment.doctorEmail,
      subject: "Appointment cancelled",
      message: `${appointment.patientName} cancelled the appointment on ${appointment.timeSlot}, ${appointment.appointmentDate.toDateString()}.`
    });

    return res.status(200).json({
      message: "Appointment cancelled successfully",
      appointment
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while cancelling appointment" });
  }
};

const getDoctorAppointments = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = buildDoctorOwnershipFilter(req.user);

    if (status) {
      filter.status = status;
    }

    const appointments = await Appointment.find(filter).sort({ appointmentDate: -1, createdAt: -1 });
    return res.status(200).json(appointments);
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching doctor appointments" });
  }
};

const getDoctorAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      ...buildDoctorOwnershipFilter(req.user)
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json(appointment);
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching appointment" });
  }
};

const acceptAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      ...buildDoctorOwnershipFilter(req.user)
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status !== "PENDING") {
      return res.status(400).json({ message: "Only pending appointments can be accepted" });
    }

    appointment.status = "ACCEPTED";
    appointment.rejectionReason = "";

    if (!appointment.meetingLink) {
      appointment.meetingLink = buildJitsiLink(appointment);
    }

    await appointment.save();

    void notifyByEmail({
      to: appointment.patientEmail,
      subject: "Appointment accepted",
      message: `Your appointment with Dr. ${appointment.doctorName} was accepted. Meeting link: ${appointment.meetingLink}`
    });

    return res.status(200).json({
      message: "Appointment accepted successfully",
      appointment
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while accepting appointment" });
  }
};

const rejectAppointment = async (req, res) => {
  try {
    const { rejectionReason = "Doctor is unavailable for this slot" } = req.body;

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      ...buildDoctorOwnershipFilter(req.user)
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status !== "PENDING") {
      return res.status(400).json({ message: "Only pending appointments can be rejected" });
    }

    appointment.status = "REJECTED";
    appointment.rejectionReason = rejectionReason;
    await appointment.save();

    void notifyByEmail({
      to: appointment.patientEmail,
      subject: "Appointment rejected",
      message: `Your appointment with Dr. ${appointment.doctorName} was rejected. Reason: ${rejectionReason}`
    });

    return res.status(200).json({
      message: "Appointment rejected successfully",
      appointment
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while rejecting appointment" });
  }
};

const completeAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      ...buildDoctorOwnershipFilter(req.user)
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status !== "ACCEPTED") {
      return res.status(400).json({ message: "Only accepted appointments can be marked as completed" });
    }

    appointment.status = "COMPLETED";
    await appointment.save();

    void notifyByEmail({
      to: appointment.patientEmail,
      subject: "Consultation completed",
      message: `Your consultation with Dr. ${appointment.doctorName} has been marked as completed.`
    });

    return res.status(200).json({
      message: "Appointment marked as completed",
      appointment
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while completing appointment" });
  }
};

module.exports = {
  getAvailableSlots,
  bookAppointment,
  getMyAppointments,
  getMyAppointmentById,
  updateMyAppointment,
  cancelMyAppointment,
  getDoctorAppointments,
  getDoctorAppointmentById,
  acceptAppointment,
  rejectAppointment,
  completeAppointment
};
