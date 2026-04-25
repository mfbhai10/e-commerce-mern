const mongoose = require("mongoose");

const slugify = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    altText: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  },
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 180,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid product slug format"],
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: 320,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 5000,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    subCategories: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
      ],
      default: [],
    },
    brand: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 64,
      index: true,
    },
    barcode: {
      type: String,
      trim: true,
      maxlength: 64,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    compareAtPrice: {
      type: Number,
      min: 0,
      validate: {
        validator: function validator(value) {
          if (value === undefined || value === null) {
            return true;
          }
          return value >= this.price;
        },
        message: "compareAtPrice must be greater than or equal to price",
      },
    },
    costPrice: {
      type: Number,
      min: 0,
      select: false,
    },
    currency: {
      type: String,
      uppercase: true,
      trim: true,
      default: "USD",
      match: [/^[A-Z]{3}$/, "Currency must be a valid 3-letter ISO code"],
    },
    stock: {
      quantity: {
        type: Number,
        default: 0,
        min: 0,
      },
      reserved: {
        type: Number,
        default: 0,
        min: 0,
      },
      lowStockThreshold: {
        type: Number,
        default: 5,
        min: 0,
      },
      trackInventory: {
        type: Boolean,
        default: true,
      },
    },
    images: {
      type: [imageSchema],
      default: [],
      validate: {
        validator: (value) => value.length <= 20,
        message: "A product can have up to 20 images only",
      },
    },
    tags: {
      type: [
        {
          type: String,
          trim: true,
          lowercase: true,
          maxlength: 40,
        },
      ],
      default: [],
    },
    attributes: {
      type: Map,
      of: String,
      default: {},
    },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ sku: 1 }, { unique: true });
productSchema.index({ category: 1, status: 1, createdAt: -1 });
productSchema.index({ name: "text", description: "text", tags: "text" });

productSchema.virtual("availableStock").get(function getAvailableStock() {
  return Math.max(0, this.stock.quantity - this.stock.reserved);
});

productSchema.pre("validate", function preValidate(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }

  if (this.slug) {
    this.slug = slugify(this.slug);
  }

  if (this.sku) {
    this.sku = this.sku.trim().toUpperCase();
  }

  next();
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
