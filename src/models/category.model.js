const mongoose = require("mongoose");

const slugify = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid category slug format"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    image: {
      url: {
        type: String,
        trim: true,
        maxlength: 500,
      },
      altText: {
        type: String,
        trim: true,
        maxlength: 150,
      },
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    ancestors: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
      ],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
    seo: {
      metaTitle: {
        type: String,
        trim: true,
        maxlength: 160,
      },
      metaDescription: {
        type: String,
        trim: true,
        maxlength: 320,
      },
      metaKeywords: {
        type: [
          {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: 50,
          },
        ],
        default: [],
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parent: 1, isActive: 1, sortOrder: 1 });

categorySchema.pre("validate", function preValidate(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }

  if (this.slug) {
    this.slug = slugify(this.slug);
  }

  next();
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
