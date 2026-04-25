const multer = require("multer");
const ApiError = require("../utils/ApiError");

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }

  return cb(new ApiError(400, "Only image files are allowed"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    files: 10,
    fileSize: 5 * 1024 * 1024,
  },
});

const uploadProductImages = upload.array("images", 10);

module.exports = {
  uploadProductImages,
};
