const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { env } = require("../config/env");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const extractToken = (req) => {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return null;
};

const protect = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);

  if (!token) {
    throw new ApiError(401, "Not authorized, token is missing");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (_error) {
    throw new ApiError(401, "Not authorized, token is invalid or expired");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, "Not authorized, user no longer exists");
  }

  req.user = {
    id: user._id.toString(),
    role: user.role,
    email: user.email,
    name: user.name,
  };

  next();
});

const admin = (req, _res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return next(new ApiError(403, "Access denied: admin role required"));
  }

  return next();
};

module.exports = {
  protect,
  admin,
};
