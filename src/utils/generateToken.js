const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

const generateToken = ({ id, role }) =>
  jwt.sign({ role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    algorithm: "HS256",
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
    subject: String(id),
  });

module.exports = generateToken;
