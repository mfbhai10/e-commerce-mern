const mongoose = require("mongoose");

const roundMoney = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const addressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[+]?[0-9\-()\s]{7,20}$/, "Please provide a valid phone number"],
    },
    line1: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    line2: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    state: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    country: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 2,
      default: "US",
    },
  },
  {
    _id: false,
  },
);

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 64,
    },
    image: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 1000,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "Order must contain at least one item",
      },
    },
    shippingAddress: {
      type: addressSchema,
      required: true,
    },
    billingAddress: {
      type: addressSchema,
    },
    pricing: {
      subtotal: {
        type: Number,
        default: 0,
        min: 0,
      },
      shippingFee: {
        type: Number,
        default: 0,
        min: 0,
      },
      tax: {
        type: Number,
        default: 0,
        min: 0,
      },
      discount: {
        type: Number,
        default: 0,
        min: 0,
      },
      total: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    currency: {
      type: String,
      uppercase: true,
      trim: true,
      default: "USD",
      match: [/^[A-Z]{3}$/, "Currency must be a valid 3-letter ISO code"],
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
      index: true,
    },
    payment: {
      method: {
        type: String,
        enum: [
          "stripe",
          "paypal",
          "cod",
          "bank_transfer",
          "manual",
          "sslcommerz",
        ],
        default: "cod",
      },
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded", "partially_refunded"],
        default: "pending",
      },
      gateway: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 40,
      },
      gatewaySessionKey: {
        type: String,
        trim: true,
        maxlength: 255,
      },
      gatewayValidationId: {
        type: String,
        trim: true,
        maxlength: 255,
      },
      inventoryRestored: {
        type: Boolean,
        default: false,
      },
      transactionId: {
        type: String,
        trim: true,
        maxlength: 180,
      },
      paidAt: {
        type: Date,
      },
    },
    coupon: {
      code: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 50,
      },
      discountType: {
        type: String,
        enum: ["fixed", "percentage"],
      },
      discountValue: {
        type: Number,
        min: 0,
      },
    },
    notes: {
      customerNote: {
        type: String,
        trim: true,
        maxlength: 1000,
      },
      internalNote: {
        type: String,
        trim: true,
        maxlength: 1000,
      },
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    deliveredAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ "payment.status": 1 });

orderSchema.pre("validate", function preValidate(next) {
  if (!this.orderNumber) {
    const randomSuffix = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");
    this.orderNumber = `ORD-${Date.now()}-${randomSuffix}`;
  }

  let subtotal = 0;
  for (const item of this.items || []) {
    item.totalPrice = roundMoney(item.unitPrice * item.quantity);
    subtotal += item.totalPrice;
  }

  this.pricing.subtotal = roundMoney(subtotal);
  this.pricing.shippingFee = roundMoney(this.pricing.shippingFee || 0);
  this.pricing.tax = roundMoney(this.pricing.tax || 0);
  this.pricing.discount = roundMoney(this.pricing.discount || 0);

  const grossTotal =
    this.pricing.subtotal +
    this.pricing.shippingFee +
    this.pricing.tax -
    this.pricing.discount;
  this.pricing.total = roundMoney(Math.max(0, grossTotal));

  if (this.payment.status === "paid" && !this.payment.paidAt) {
    this.payment.paidAt = new Date();
  }

  next();
});

orderSchema.pre("save", function preSave(next) {
  const shouldTrackStatus = this.isNew || this.isModified("status");
  if (shouldTrackStatus) {
    this.statusHistory.push({ status: this.status, changedAt: new Date() });
  }

  if (this.status === "delivered" && !this.deliveredAt) {
    this.deliveredAt = new Date();
  }

  if (this.status === "cancelled" && !this.cancelledAt) {
    this.cancelledAt = new Date();
  }

  next();
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
