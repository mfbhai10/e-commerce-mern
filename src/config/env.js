const dotenv = require("dotenv");

dotenv.config();

const requiredEnvVars = ["MONGO_URI", "JWT_SECRET"];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  jwtIssuer: process.env.JWT_ISSUER || "ecommerce-api",
  jwtAudience: process.env.JWT_AUDIENCE || "ecommerce-client",
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER || "ecommerce/products",
  frontendBaseUrl: process.env.FRONTEND_BASE_URL || "http://localhost:3000",
  backendBaseUrl: process.env.BACKEND_BASE_URL || "http://localhost:5000",
  sslcommerzStoreId: process.env.SSLCOMMERZ_STORE_ID || "",
  sslcommerzStorePassword: process.env.SSLCOMMERZ_STORE_PASSWORD || "",
  sslcommerzIsLive:
    String(process.env.SSLCOMMERZ_IS_LIVE || "false") === "true",
  sslcommerzInitUrl: process.env.SSLCOMMERZ_INIT_URL || "",
  sslcommerzValidationUrl: process.env.SSLCOMMERZ_VALIDATION_URL || "",
  corsOrigin: process.env.CORS_ORIGIN || "*",
};

module.exports = { env };
