const orderService = require("../services/order.service");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder({
    userId: req.user.id,
    ...req.body,
  });

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    data: { order },
  });
});

const getUserOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getUserOrders({
    userId: req.user.id,
    page: req.query.page,
    limit: req.query.limit,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

const getAllOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getAllOrders(req.query);

  res.status(200).json({
    success: true,
    data: result,
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, paymentStatus } = req.body;

  if (!status) {
    throw new ApiError(400, "status is required");
  }

  const order = await orderService.updateOrderStatus({
    orderId: req.params.id,
    status,
    paymentStatus,
  });

  res.status(200).json({
    success: true,
    message: "Order status updated successfully",
    data: { order },
  });
});

module.exports = {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
};
