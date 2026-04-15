import Doctor from '../models/Doctor.js';

// GET /api/doctors
export const getAllDoctors = async (req, res) => {
  try {
    const { specialty, name, minFee, maxFee, page = 1, limit = 10 } = req.query;
    const filter = { isVerified: true, isAvailable: true };

    if (specialty) filter.specialty = specialty;
    if (name) filter.name = { $regex: name, $options: 'i' };

    if (minFee || maxFee) {
      filter.consultationFee = {};
      if (minFee) filter.consultationFee.$gte = Number(minFee);
      if (maxFee) filter.consultationFee.$lte = Number(maxFee);
    }

    const doctors = await Doctor.find(filter)
      .select('-__v')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ rating: -1 });

    const total = await Doctor.countDocuments(filter);

    res.json({
      doctors,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/doctors/:id
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('-__v');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/doctors/profile
export const createProfile = async (req, res) => {
  try {
    const existing = await Doctor.findOne({ userId: req.user.id });
    if (existing) return res.status(400).json({ message: 'Profile already exists' });

    const doctor = new Doctor({
      ...req.body,
      userId: req.user.id,
      email: req.user.email,
    });

    await doctor.save();
    res.status(201).json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/doctors/profile
export const updateProfile = async (req, res) => {
  try {
    const forbidden = ['userId', 'email', 'isVerified', 'rating', 'totalRatings'];
    forbidden.forEach((f) => delete req.body[f]);

    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!doctor) return res.status(404).json({ message: 'Profile not found' });

    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/doctors/me
export const getMyProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) return res.status(404).json({ message: 'Profile not found' });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/doctors/:id/verify
export const verifyDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    );

    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    res.json({ message: 'Doctor verified', doctor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/doctors/:id/rating
export const updateRating = async (req, res) => {
  try {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    await doctor.updateRating(rating);

    res.json({ message: 'Rating updated', rating: doctor.rating });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};