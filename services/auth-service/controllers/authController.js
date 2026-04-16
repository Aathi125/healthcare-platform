const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

const sanitizeUser = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };
};

const registerPatient = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "PATIENT"
    });

    const token = createToken(user);

    return res.status(201).json({
      message: "Patient registered successfully",
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while registering patient" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = createToken(user);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while logging in" });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching user profile" });
  }
};

const getDoctorAccounts = async (req, res) => {
  try {
    const doctorUsers = await User.find({ role: "DOCTOR" }).sort({ createdAt: -1 });

    return res.status(200).json(doctorUsers.map(sanitizeUser));
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching doctor accounts" });
  }
};

const createDoctorAccount = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const doctorUser = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "DOCTOR"
    });

    return res.status(201).json({
      message: "Doctor login account created successfully",
      user: sanitizeUser(doctorUser)
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while creating doctor account" });
  }
};

const createAdminAccount = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "ADMIN"
    });

    return res.status(201).json({
      message: "Admin account created successfully",
      user: sanitizeUser(adminUser)
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while creating admin account" });
  }
};

module.exports = {
  registerPatient,
  loginUser,
  getMe,
  getDoctorAccounts,
  createDoctorAccount,
  createAdminAccount
};
