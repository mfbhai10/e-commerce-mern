const mongoose = require("mongoose");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const ApiError = require("../utils/ApiError");

const VALID_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

const assertValidObjectId = (value, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }
};

const createOrder = async ({
  userId,
  items,
  shippingAddress,
  billingAddress,
  pricing,
  payment,
  coupon,
  notes,
}) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Order items are required");
  }

  if (!shippingAddress) {
    throw new ApiError(400, "shippingAddress is required");
  }

  const normalizedItemsInput = items.map((item) => {
    if (!item.product || !item.quantity) {
      throw new ApiError(400, "Each item must include product and quantity");
    }

    assertValidObjectId(item.product, "product id");

    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new ApiError(400, "Each item quantity must be greater than 0");
    }

    return {
      product: String(item.product),
      quantity,
    };
  });

  const productIds = [
    ...new Set(normalizedItemsInput.map((item) => item.product)),
  ];
  const products = await Product.find({ _id: { $in: productIds } });

  if (products.length !== productIds.length) {
    throw new ApiError(400, "One or more products are invalid");
  }

  const productMap = new Map(
    products.map((product) => [String(product._id), product]),
  );

  const snapshotItems = normalizedItemsInput.map(
    ({ product: productId, quantity }) => {
      const product = productMap.get(productId);

      if (!product || product.status === "archived") {
        throw new ApiError(400, "One or more products are unavailable");
      }

      if (product.stock.trackInventory) {
        const availableStock = product.stock.quantity - product.stock.reserved;
        if (availableStock < quantity) {
          throw new ApiError(
            400,
            `Insufficient stock for product ${product.name}`,
          );
        }
      }

      const primaryImage =
        (product.images || []).find((img) => img.isPrimary) ||
        product.images?.[0];

      return {
        product: product._id,
        name: product.name,
        sku: product.sku,
        image: primaryImage?.url,
        quantity,
        unitPrice: product.price,
        totalPrice: product.price * quantity,
      };
    },
  );

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    for (const item of snapshotItems) {
      const product = productMap.get(String(item.product));
      if (product.stock.trackInventory) {
        const updateResult = await Product.updateOne(
          { _id: product._id, "stock.quantity": { $gte: item.quantity } },
          { $inc: { "stock.quantity": -item.quantity } },
          { session },
        );

        if (!updateResult.modifiedCount) {
          throw new ApiError(
            409,
            `Insufficient stock for product ${product.name}`,
          );
        }
      }
    }

    const [order] = await Order.create(
      [
        {
          user: userId,
          items: snapshotItems,
          shippingAddress,
          billingAddress: billingAddress || shippingAddress,
          pricing: pricing || {},
          payment: payment || {},
          coupon: coupon || undefined,
          notes: notes || {},
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return Order.findById(order._id)
      .populate("items.product", "name slug")
      .populate("user", "name email");
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getUserOrders = async ({ userId, page = 1, limit = 20 }) => {
  const parsedPage = Math.max(1, Number(page) || 1);
  const parsedLimit = Math.min(100, Math.max(1, Number(limit) || 20));

  const filter = { user: userId };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("items.product", "name slug")
      .sort({ createdAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      pages: Math.ceil(total / parsedLimit),
    },
  };
};

const getAllOrders = async ({
  page = 1,
  limit = 20,
  status,
  user,
  paymentStatus,
}) => {
  const parsedPage = Math.max(1, Number(page) || 1);
  const parsedLimit = Math.min(100, Math.max(1, Number(limit) || 20));

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (paymentStatus) {
    filter["payment.status"] = paymentStatus;
  }

  if (user) {
    assertValidObjectId(user, "user id");
    filter.user = user;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "name email role")
      .populate("items.product", "name sku")
      .sort({ createdAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      pages: Math.ceil(total / parsedLimit),
    },
  };
};

const updateOrderStatus = async ({ orderId, status, paymentStatus }) => {
  assertValidObjectId(orderId, "order id");

  if (!status || !VALID_ORDER_STATUSES.includes(status)) {
    throw new ApiError(400, "A valid order status is required");
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  order.status = status;

  if (paymentStatus) {
    order.payment.status = paymentStatus;
  }

  await order.save();

  return Order.findById(order._id)
    .populate("user", "name email")
    .populate("items.product", "name slug sku");
};

module.exports = {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
};
