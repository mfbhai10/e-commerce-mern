const mongoose = require("mongoose");
const Category = require("../models/category.model");
const Product = require("../models/product.model");
const ApiError = require("../utils/ApiError");

const assertValidObjectId = (value, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }
};

const getAllCategories = async ({
  page = 1,
  limit = 20,
  isActive,
  parent,
} = {}) => {
  const parsedPage = Math.max(1, Number(page) || 1);
  const parsedLimit = Math.min(100, Math.max(1, Number(limit) || 20));

  const filter = {};
  if (typeof isActive !== "undefined") {
    filter.isActive = String(isActive) === "true";
  }

  if (parent) {
    if (parent === "null") {
      filter.parent = null;
    } else {
      assertValidObjectId(parent, "parent category id");
      filter.parent = parent;
    }
  }

  const [categories, total] = await Promise.all([
    Category.find(filter)
      .populate("parent", "name slug")
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit),
    Category.countDocuments(filter),
  ]);

  return {
    categories,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      pages: Math.ceil(total / parsedLimit),
    },
  };
};

const getCategoryById = async (categoryId) => {
  assertValidObjectId(categoryId, "category id");

  const category = await Category.findById(categoryId).populate(
    "parent",
    "name slug",
  );
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return category;
};

const createCategory = async (payload) => {
  if (!payload.name) {
    throw new ApiError(400, "Category name is required");
  }

  if (payload.parent) {
    assertValidObjectId(payload.parent, "parent category id");

    const parentCategory = await Category.findById(payload.parent);
    if (!parentCategory) {
      throw new ApiError(404, "Parent category not found");
    }

    payload.ancestors = [
      ...(parentCategory.ancestors || []),
      parentCategory._id,
    ];
  }

  return Category.create(payload);
};

const updateCategory = async (categoryId, payload) => {
  assertValidObjectId(categoryId, "category id");

  const category = await Category.findById(categoryId);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  if (payload.parent) {
    assertValidObjectId(payload.parent, "parent category id");

    if (String(payload.parent) === String(category._id)) {
      throw new ApiError(400, "Category cannot be its own parent");
    }

    const parentCategory = await Category.findById(payload.parent);
    if (!parentCategory) {
      throw new ApiError(404, "Parent category not found");
    }

    payload.ancestors = [
      ...(parentCategory.ancestors || []),
      parentCategory._id,
    ];
  }

  Object.assign(category, payload);
  await category.save();
  return category;
};

const deleteCategory = async (categoryId) => {
  assertValidObjectId(categoryId, "category id");

  const [category, hasChildren, hasProducts] = await Promise.all([
    Category.findById(categoryId),
    Category.exists({ parent: categoryId }),
    Product.exists({
      $or: [{ category: categoryId }, { subCategories: categoryId }],
    }),
  ]);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  if (hasChildren) {
    throw new ApiError(409, "Cannot delete category with child categories");
  }

  if (hasProducts) {
    throw new ApiError(409, "Cannot delete category linked to products");
  }

  await category.deleteOne();
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
