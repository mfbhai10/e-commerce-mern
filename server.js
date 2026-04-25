const app = require("./src/app");
const connectDB = require("./src/config/db");
const { env } = require("./src/config/env");

(async () => {
  try {
    await connectDB();

    const server = app.listen(env.port, () => {
      console.log(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
    });

    const gracefulShutdown = () => {
      server.close(() => {
        console.log("HTTP server closed.");
        process.exit(0);
      });
    };

    process.on("SIGINT", gracefulShutdown);
    process.on("SIGTERM", gracefulShutdown);
  } catch (error) {
    console.error("Failed to bootstrap application:", error.message);
    process.exit(1);
  }
})();
