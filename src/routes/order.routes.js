const express = require("express");
const orderController = require("../controllers/order.controller");
const { protect, admin } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", protect, orderController.createOrder);
router.get("/me", protect, orderController.getUserOrders);
router.get("/", protect, admin, orderController.getAllOrders);
router.patch("/:id/status", protect, admin, orderController.updateOrderStatus);

module.exports = router;
