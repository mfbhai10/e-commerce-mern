const express = require("express");
const paymentController = require("../controllers/payment.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
  "/sslcommerz/session/:orderId",
  protect,
  paymentController.createSslCommerzSession,
);

router.get(
  "/sslcommerz/redirect/:orderId",
  protect,
  paymentController.redirectToSslCommerz,
);

router.post("/sslcommerz/success", paymentController.sslCommerzSuccess);
router.post("/sslcommerz/fail", paymentController.sslCommerzFail);
router.post("/sslcommerz/cancel", paymentController.sslCommerzCancel);

router.get("/sslcommerz/success", paymentController.sslCommerzSuccess);
router.get("/sslcommerz/fail", paymentController.sslCommerzFail);
router.get("/sslcommerz/cancel", paymentController.sslCommerzCancel);

module.exports = router;
