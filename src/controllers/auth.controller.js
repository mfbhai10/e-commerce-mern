const authService = require("../services/auth.service");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const generateToken = require("../utils/generateToken");
const { env } = require("../config/env");

const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "name, email and password are required");
  }

  const user = await authService.register({ name, email, password });
  const token = generateToken({ id: user.id, role: user.role });
  setAuthCookie(res, token);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: { user, token },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "email and password are required");
  }

  const user = await authService.login({ email, password });
  const token = generateToken({ id: user.id, role: user.role });
  setAuthCookie(res, token);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: { user, token },
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user.id);

  res.status(200).json({
    success: true,
    data: { user },
  });
});

const adminCheck = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Admin access granted",
  });
});

module.exports = {
  register,
  login,
  me,
  adminCheck,
};
