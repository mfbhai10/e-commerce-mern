const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { env } = require("../config/env");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const extractToken = (req) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme?.toLowerCase() === "bearer" && token) {
    return token;
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
    decoded = jwt.verify(token, env.jwtSecret, {
      algorithms: ["HS256"],
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
    });
  } catch (_error) {
    throw new ApiError(401, "Not authorized, token is invalid or expired");
  }

  const userId = decoded.sub || decoded.id;
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(401, "Not authorized, user no longer exists");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Account is inactive");
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
