const productService = require("../services/product.service");
const asyncHandler = require("../utils/asyncHandler");
const { uploadProductImages } = require("../utils/cloudinary");

const parseMaybeJson = (value, fallback) => {
  if (typeof value !== "string") {
    return value === undefined ? fallback : value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  try {
    return JSON.parse(trimmed);
  } catch (_error) {
    return value;
  }
};

const normalizeProductPayload = (body) => {
  const payload = { ...body };

  if (Object.prototype.hasOwnProperty.call(payload, "subCategories")) {
    payload.subCategories = parseMaybeJson(payload.subCategories, []);
  }

  if (Object.prototype.hasOwnProperty.call(payload, "tags")) {
    payload.tags = parseMaybeJson(payload.tags, []);
  }

  if (Object.prototype.hasOwnProperty.call(payload, "images")) {
    payload.images = parseMaybeJson(payload.images, []);
  }

  if (Object.prototype.hasOwnProperty.call(payload, "attributes")) {
    payload.attributes = parseMaybeJson(payload.attributes, {});
  }

  if (Object.prototype.hasOwnProperty.call(payload, "stock")) {
    payload.stock = parseMaybeJson(payload.stock, {});
  }

  return payload;
};

const mergeImages = (existingImages = [], uploadedImages = []) => {
  const normalizedExisting = Array.isArray(existingImages)
    ? existingImages.filter((image) => image && image.url)
    : [];

  const merged = [...normalizedExisting, ...uploadedImages];

  const hasPrimary = merged.some((image) => image.isPrimary);
  if (!hasPrimary && merged.length) {
    merged[0].isPrimary = true;
  }

  return merged;
};

const getProducts = asyncHandler(async (req, res) => {
  const result = await productService.getAllProducts(req.query);

  res.status(200).json({
    success: true,
    data: result,
  });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);

  res.status(200).json({
    success: true,
    data: { product },
  });
});

const createProduct = asyncHandler(async (req, res) => {
  const payload = normalizeProductPayload(req.body);
  const uploadedImages = await uploadProductImages(req.files || []);
  payload.images = mergeImages(payload.images, uploadedImages);

  const product = await productService.createProduct(payload, req.user.id);

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: { product },
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const payload = normalizeProductPayload(req.body);
  const uploadedImages = await uploadProductImages(req.files || []);

  if (uploadedImages.length) {
    const existingProduct = await productService.getProductById(req.params.id);
    payload.images = mergeImages(existingProduct.images, uploadedImages);
  }

  const product = await productService.updateProduct(req.params.id, payload);

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: { product },
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id);

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
