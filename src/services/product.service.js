const mongoose = require("mongoose");
const Product = require("../models/product.model");
const Category = require("../models/category.model");
const ApiError = require("../utils/ApiError");

const assertValidObjectId = (value, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }
};

const ensureCategoriesExist = async (categoryId, subCategoryIds = []) => {
  assertValidObjectId(categoryId, "category id");

  const ids = [categoryId, ...subCategoryIds]
    .filter(Boolean)
    .map((id) => String(id));
  const uniqueIds = [...new Set(ids)];

  uniqueIds.forEach((id) => assertValidObjectId(id, "category id"));

  const categories = await Category.find({ _id: { $in: uniqueIds } }).select(
    "_id",
  );
  if (categories.length !== uniqueIds.length) {
    throw new ApiError(400, "One or more category references are invalid");
  }
};

const getAllProducts = async ({
  page = 1,
  limit = 20,
  search,
  category,
  status,
  isFeatured,
  minPrice,
  maxPrice,
  sort = "-createdAt",
} = {}) => {
  const parsedPage = Math.max(1, Number(page) || 1);
  const parsedLimit = Math.min(100, Math.max(1, Number(limit) || 20));

  const filter = {};

  if (search) {
    filter.$text = { $search: search };
  }

  if (category) {
    assertValidObjectId(category, "category id");
    filter.$or = [{ category }, { subCategories: category }];
  }

  if (status) {
    filter.status = status;
  }

  if (typeof isFeatured !== "undefined") {
    filter.isFeatured = String(isFeatured) === "true";
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) {
      filter.price.$gte = Number(minPrice);
    }
    if (maxPrice) {
      filter.price.$lte = Number(maxPrice);
    }
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .populate("createdBy", "name email")
      .sort(sort)
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      pages: Math.ceil(total / parsedLimit),
    },
  };
};

const getProductById = async (productId) => {
  assertValidObjectId(productId, "product id");

  const product = await Product.findById(productId)
    .populate("category", "name slug")
    .populate("subCategories", "name slug")
    .populate("createdBy", "name email");

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return product;
};

const createProduct = async (payload, createdBy) => {
  if (
    !payload.name ||
    !payload.description ||
    !payload.sku ||
    !payload.category
  ) {
    throw new ApiError(400, "name, description, sku and category are required");
  }

  await ensureCategoriesExist(payload.category, payload.subCategories || []);

  const product = await Product.create({
    ...payload,
    createdBy,
  });

  return product;
};

const updateProduct = async (productId, payload) => {
  assertValidObjectId(productId, "product id");

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const categoryToValidate = payload.category || product.category;
  const subCategoriesToValidate =
    payload.subCategories || product.subCategories;

  await ensureCategoriesExist(categoryToValidate, subCategoriesToValidate);

  Object.assign(product, payload);
  await product.save();
  return product;
};

const deleteProduct = async (productId) => {
  assertValidObjectId(productId, "product id");

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  await product.deleteOne();
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
