const { v2: cloudinary } = require("cloudinary");
const { env } = require("../config/env");
const ApiError = require("./ApiError");

cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
  secure: true,
});

const hasCloudinaryCredentials = () =>
  Boolean(
    env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret,
  );

const uploadBufferToCloudinary = (fileBuffer, options = {}) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          return reject(error);
        }

        return resolve(result);
      },
    );

    uploadStream.end(fileBuffer);
  });

const uploadProductImages = async (files = []) => {
  if (!files.length) {
    return [];
  }

  if (!hasCloudinaryCredentials()) {
    throw new ApiError(
      500,
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET",
    );
  }

  const uploaded = await Promise.all(
    files.map((file, index) =>
      uploadBufferToCloudinary(file.buffer, {
        folder: env.cloudinaryFolder || "ecommerce/products",
        resource_type: "image",
        transformation: [
          { quality: "auto", fetch_format: "auto" },
          { width: 1600, height: 1600, crop: "limit" },
        ],
        public_id: `${Date.now()}-${index}`,
      }),
    ),
  );

  return uploaded.map((asset, index) => ({
    url: asset.secure_url,
    altText: files[index]?.originalname || "product-image",
    isPrimary: index === 0,
  }));
};

module.exports = {
  uploadProductImages,
};
