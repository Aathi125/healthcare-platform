import Prescription from '../models/Prescription.js';
import Doctor from '../models/Doctor.js';

// POST /api/prescriptions
export const createPrescription = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const prescription = new Prescription({
      ...req.body,
      doctorId: doctor._id,
    });

    await prescription.save();
    res.status(201).json(prescription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/prescriptions/appointment/:appointmentId
export const getByAppointment = async (req, res) => {
  try {
    const prescription = await Prescription.findOne({
      appointmentId: req.params.appointmentId,
    }).populate('doctorId', 'name specialty');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json(prescription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/prescriptions/patient/:patientId
export const getPatientPrescriptions = async (req, res) => {
  try {
    if (
      req.user.role === 'patient' &&
      req.user.id !== req.params.patientId
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const prescriptions = await Prescription.find({
      patientId: req.params.patientId,
    })
      .populate('doctorId', 'name specialty')
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/prescriptions/my
export const getMyPrescriptions = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const prescriptions = await Prescription.find({
      doctorId: doctor._id,
    }).sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};