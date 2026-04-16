const path = require("path");
const fs = require("fs");
const PatientProfile = require("../models/PatientProfile");
const Report = require("../models/Report");
const Prescription = require("../models/Prescription");

const getAppointmentServiceUrl = () =>
  (process.env.APPOINTMENT_SERVICE_URL || "http://appointment-service:4003").replace(/\/+$/, "");
const getNotificationServiceUrl = () =>
  (process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:4006").replace(/\/+$/, "");

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

const getOrCreateMyProfile = async (user) => {
  let profile = await PatientProfile.findOne({ userId: user.id });

  if (!profile) {
    profile = await PatientProfile.create({
      userId: user.id,
      name: user.name,
      email: user.email
    });
  }

  return profile;
};

const getMyProfile = async (req, res) => {
  try {
    const profile = await getOrCreateMyProfile(req.user);
    return res.status(200).json(profile);
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching patient profile" });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const profile = await getOrCreateMyProfile(req.user);

    const allowedFields = ["name", "phone", "dateOfBirth", "gender", "address", "medicalHistory"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    await profile.save();

    return res.status(200).json({
      message: "Patient profile updated successfully",
      profile
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while updating profile" });
  }
};

const uploadMyReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file" });
    }

    const profile = await getOrCreateMyProfile(req.user);

    const report = await Report.create({
      patientId: req.user.id,
      patientName: profile.name,
      title: req.body.title || "Medical Report",
      description: req.body.description || "",
      originalName: req.file.originalname,
      storedName: req.file.filename,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      fileSize: req.file.size
    });

    return res.status(201).json({
      message: "Report uploaded successfully",
      report
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while uploading report" });
  }
};

const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ patientId: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json(reports);
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching reports" });
  }
};

const getReportsByPatientId = async (req, res) => {
  try {
    const reports = await Report.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    return res.status(200).json(reports);
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching reports" });
  }
};

const downloadReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (req.user.role === "PATIENT" && report.patientId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const resolvedPath = path.resolve(report.filePath);
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ message: "Report file not found on server" });
    }

    return res.download(resolvedPath, report.originalName);
  } catch (error) {
    return res.status(500).json({ message: "Server error while downloading report" });
  }
};

const validateAppointmentForDoctor = async (appointmentId, authHeader) => {
  const response = await fetch(`${getAppointmentServiceUrl()}/appointments/doctor/${appointmentId}`, {
    headers: {
      Authorization: authHeader
    }
  });

  if (!response.ok) {
    return { valid: false, message: "Appointment not found for this doctor" };
  }

  const appointment = await response.json();
  if (!["ACCEPTED", "COMPLETED"].includes(appointment.status)) {
    return { valid: false, message: "Prescription can only be issued for accepted/completed appointments" };
  }

  return { valid: true };
};

const issuePrescription = async (req, res) => {
  try {
    const { patientId, appointmentId = "", medicines = [], notes = "" } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: "patientId is required" });
    }

    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ message: "medicines must be a non-empty array" });
    }

    const patientProfile = await PatientProfile.findOne({ userId: patientId });
    if (!patientProfile) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    if (appointmentId) {
      const appointmentCheck = await validateAppointmentForDoctor(appointmentId, req.headers.authorization || "");
      if (!appointmentCheck.valid) {
        return res.status(400).json({ message: appointmentCheck.message });
      }
    }

    const normalizedMedicines = medicines
      .map((item) => ({
        name: item.name,
        dosage: item.dosage || "",
        instructions: item.instructions || ""
      }))
      .filter((item) => item.name);

    if (normalizedMedicines.length === 0) {
      return res.status(400).json({ message: "Each medicine must include a name" });
    }

    const prescription = await Prescription.create({
      patientId,
      patientName: patientProfile.name,
      doctorId: req.user.id,
      doctorName: req.user.name,
      appointmentId,
      medicines: normalizedMedicines,
      notes,
      issuedDate: new Date()
    });

    await notifyByEmail({
      to: patientProfile.email,
      subject: "New prescription issued",
      message: `Dr. ${req.user.name} issued a prescription for your consultation.`
    });

    return res.status(201).json({
      message: "Prescription issued successfully",
      prescription
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while issuing prescription" });
  }
};

const getMyPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.user.id }).sort({ issuedDate: -1, createdAt: -1 });
    return res.status(200).json(prescriptions);
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching prescriptions" });
  }
};

const getDoctorPrescriptions = async (req, res) => {
  try {
    const filter = { doctorId: req.user.id };
    if (req.query.patientId) {
      filter.patientId = req.query.patientId;
    }

    const prescriptions = await Prescription.find(filter).sort({ issuedDate: -1, createdAt: -1 });
    return res.status(200).json(prescriptions);
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching prescriptions" });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadMyReport,
  getMyReports,
  getReportsByPatientId,
  downloadReport,
  issuePrescription,
  getMyPrescriptions,
  getDoctorPrescriptions
};
