const mongoose = require("mongoose");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const ApiError = require("../utils/ApiError");
const sslcommerzService = require("./sslcommerz.service");
const { env } = require("../config/env");

const assertValidObjectId = (value, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }
};

const generateTransactionId = (order) => {
  const random = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
  return `SSL-${order.orderNumber}-${random}`.slice(0, 179);
};

const toNumber = (value) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const createSslCommerzSession = async ({ orderId, userId }) => {
  assertValidObjectId(orderId, "order id");

  const order = await Order.findById(orderId).populate(
    "user",
    "name email phone",
  );

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (String(order.user._id) !== String(userId)) {
    throw new ApiError(403, "You are not allowed to pay this order");
  }

  if (order.payment.status === "paid") {
    throw new ApiError(409, "Order is already paid");
  }

  order.payment.method = "sslcommerz";
  order.payment.gateway = "SSLCOMMERZ";

  if (!order.payment.transactionId) {
    order.payment.transactionId = generateTransactionId(order);
  }

  const successUrl = `${env.backendBaseUrl}/api/v1/payments/sslcommerz/success`;
  const failUrl = `${env.backendBaseUrl}/api/v1/payments/sslcommerz/fail`;
  const cancelUrl = `${env.backendBaseUrl}/api/v1/payments/sslcommerz/cancel`;

  const payload = {
    store_id: env.sslcommerzStoreId,
    store_passwd: env.sslcommerzStorePassword,
    total_amount: toNumber(order.pricing.total),
    currency: order.currency || "USD",
    tran_id: order.payment.transactionId,
    success_url: successUrl,
    fail_url: failUrl,
    cancel_url: cancelUrl,
    ipn_url: `${env.backendBaseUrl}/api/v1/payments/sslcommerz/success`,
    shipping_method: "NO",
    product_name: `Order ${order.orderNumber}`,
    product_category: "Ecommerce",
    product_profile: "general",
    cus_name: order.shippingAddress.fullName || order.user.name || "Customer",
    cus_email: order.user.email || "customer@example.com",
    cus_add1: order.shippingAddress.line1,
    cus_add2: order.shippingAddress.line2 || "",
    cus_city: order.shippingAddress.city,
    cus_state: order.shippingAddress.state || "",
    cus_postcode: order.shippingAddress.postalCode,
    cus_country: order.shippingAddress.country || "BD",
    cus_phone: order.shippingAddress.phone || order.user.phone || "01700000000",
    ship_name: order.shippingAddress.fullName || order.user.name || "Customer",
    ship_add1: order.shippingAddress.line1,
    ship_add2: order.shippingAddress.line2 || "",
    ship_city: order.shippingAddress.city,
    ship_state: order.shippingAddress.state || "",
    ship_postcode: order.shippingAddress.postalCode,
    ship_country: order.shippingAddress.country || "BD",
    value_a: String(order._id),
    value_b: String(order.user._id),
    value_c: String(order.orderNumber),
  };

  const gatewayResponse = await sslcommerzService.createSession({ payload });

  order.payment.gatewaySessionKey = gatewayResponse.sessionkey || "";
  await order.save();

  return {
    orderId: order._id,
    transactionId: order.payment.transactionId,
    paymentUrl: gatewayResponse.GatewayPageURL,
    gatewaySessionKey: gatewayResponse.sessionkey,
  };
};

const restoreOrderStock = async ({ order, session }) => {
  if (!order.items?.length) {
    return;
  }

  for (const item of order.items) {
    await Product.updateOne(
      { _id: item.product },
      { $inc: { "stock.quantity": item.quantity } },
      { session },
    );
  }
};

const updateOrderAfterCallback = async ({ statusType, payload }) => {
  const transactionId = payload.tran_id;

  if (!transactionId) {
    throw new ApiError(400, "Missing transaction id");
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await Order.findOne({
      "payment.transactionId": transactionId,
    }).session(session);

    if (!order) {
      throw new ApiError(404, "Order not found for transaction");
    }

    if (statusType === "success") {
      if (order.payment.status === "paid") {
        await session.commitTransaction();
        return order;
      }

      const validationId = payload.val_id;
      if (!validationId) {
        throw new ApiError(400, "Missing SSLCommerz validation id");
      }

      const validation = await sslcommerzService.validateTransaction({
        validationId,
      });

      const isValidated =
        validation?.status === "VALID" || validation?.status === "VALIDATED";

      const transactionMatches =
        String(validation?.tran_id || "") ===
        String(order.payment.transactionId || "");

      const amountMatches =
        toNumber(validation?.amount) === toNumber(order.pricing.total);

      if (!isValidated || !transactionMatches || !amountMatches) {
        throw new ApiError(400, "Payment validation failed");
      }

      order.payment.status = "paid";
      order.payment.gateway = "SSLCOMMERZ";
      order.payment.gatewayValidationId = validationId;
      order.payment.inventoryRestored = false;
      order.payment.paidAt = new Date();
      order.status = order.status === "pending" ? "confirmed" : order.status;
      await order.save({ session });
    }

    if (statusType === "fail" || statusType === "cancel") {
      if (order.payment.status === "paid") {
        await session.commitTransaction();
        return order;
      }

      order.payment.status = "failed";
      order.status = "cancelled";

      if (!order.payment.inventoryRestored) {
        await restoreOrderStock({ order, session });
        order.payment.inventoryRestored = true;
      }

      await order.save({ session });
    }

    await session.commitTransaction();

    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  createSslCommerzSession,
  updateOrderAfterCallback,
};
