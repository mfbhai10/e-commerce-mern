const express = require("express");
const productController = require("../controllers/product.controller");
const { protect, admin } = require("../middlewares/auth.middleware");
const { uploadProductImages } = require("../middlewares/upload.middleware");

const router = express.Router();

router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);
router.post(
  "/",
  protect,
  admin,
  uploadProductImages,
  productController.createProduct,
);
router.put(
  "/:id",
  protect,
  admin,
  uploadProductImages,
  productController.updateProduct,
);
router.delete("/:id", protect, admin, productController.deleteProduct);

module.exports = router;
