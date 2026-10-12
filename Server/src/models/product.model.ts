import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    // Amazon ASIN for products imported from the Kaggle dataset; absent for products created in-app
    asin: {
      type: String,
      unique: true,
      sparse: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    image: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    selling_price: {
      type: Number,
      required: true,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

// products of a category in _id order (GET /api/dashboard/categories/:categoryId/products) — lets MongoDB
// filter and sort from the index instead of sorting in memory
productSchema.index({ category_id: 1, _id: 1 });

// search by name (GET /api/dashboard/products/search). Only ONE text index is allowed per collection.
productSchema.index({ name: "text" });


const Product = mongoose.model("Product", productSchema);

export default Product;
