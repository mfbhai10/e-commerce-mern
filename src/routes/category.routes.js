const express = require("express");
const categoryController = require("../controllers/category.controller");
const { protect, admin } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", categoryController.getCategories);
router.get("/:id", categoryController.getCategoryById);
router.post("/", protect, admin, categoryController.createCategory);
router.put("/:id", protect, admin, categoryController.updateCategory);
router.delete("/:id", protect, admin, categoryController.deleteCategory);

module.exports = router;
