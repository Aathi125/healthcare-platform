import mongoose from 'mongoose';

const protect = (req, res, next) => {
  // MOCK USER — use a consistent, valid ObjectId for development
  req.user = {
    id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"), // fixed fake ObjectId
    email: "doctor@test.com",
    role: "doctor"
  };
  next();
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient role' });
    }
    next();
  };
};

export { protect, authorizeRoles };

/*import axios from 'axios';

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const response = await axios.post(
      `${process.env.AUTH_SERVICE_URL}/api/auth/verify`,
      { token }
    );

    req.user = response.data.user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient role' });
    }
    next();
  };
};

export { protect, authorizeRoles };*/