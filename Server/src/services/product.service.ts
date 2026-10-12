import mongoose, { type Types } from "mongoose";
import Product from "../models/product.model.js";
import Review from "../models/review.model.js";
import { Cart, Category, Wishlist } from "../models/index.js";
import type { ProductType } from "../dto/product.dto.js";
import { badRequest, notFound } from "../utils/api-error.js";
import { getSellingPrice } from "../utils/price.js";

// shape of category_id after the nested populate in getProductDetailsByIdService
type PopulatedCategory = {
  _id: Types.ObjectId;
  name: string;
  parent_id: { _id: Types.ObjectId; name: string } | null;
};

const getProductDetailsByIdService = async (productId: string) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw badRequest("Invalid product ID");
  }

  // product → its category → that category's department, filled in by populate
  // (Mongoose still runs one query per level; populate just does the chaining for us)
  const product = await Product.findById(productId)
    .select("_id name image price discount rating description category_id")
    .populate<{ category_id: PopulatedCategory | null }>({
      path: "category_id",
      select: "name parent_id",
      populate: { path: "parent_id", select: "name" },
    })
    .lean();

  if (!product) {
    throw notFound("Product not found");
  }
  // populate gives null when the referenced category no longer exists
  const category = product.category_id;
  if (!category) {
    throw notFound("Category not found for the product");
  }

  // same response shape as before: product keeps the plain category id, details are split out
  const department_details = category.parent_id;
  return {
    product: { ...product, category_id: category._id },
    category_details: { _id: category._id, name: category.name, parent_id: department_details?._id ?? null },
    department_details,
  };
};

const getAllProductReviewsByProductIdService = async (
  productId: string,
  offset: number,
  limit: number,
) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw badRequest("Invalid product ID");
  }

  const [reviews, total] = await Promise.all([
    Review.find({ product_id: productId })
      .select("user_id rating comment createdAt")
      .populate({ path: "user_id", select: "first_name last_name" })
      .sort({ createdAt: -1 }) // newest first
      .skip(offset)
      .limit(limit)
      .lean(),
    Review.countDocuments({ product_id: productId }),
  ]);

  return { reviews, total };
};

const addProductReviewService = async (
  productId: string,
  userId: string,
  reviewData: {
    rating: number;
    comment?: string | undefined;
  },
) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw badRequest("Invalid product ID");
  }

  const existingReview = await Review.findOne({
    product_id: productId,
    user_id: userId,
  });
  if (existingReview) {
    throw badRequest("User has already reviewed this product");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw notFound("Product not found");
  }

  const review = new Review({
    product_id: productId,
    user_id: userId,
    ...reviewData,
  });

  await review.save();

  return review;
};

const PRODUCT_FIELDS = "_id name image price discount selling_price rating description category_id";

const assertCategoryExists = async (categoryId: string) => {
  if (!(await Category.exists({ _id: categoryId }))) {
    throw notFound("Category not found");
  }
};

const createProductService = async (data: ProductType) => {
  await assertCategoryExists(data.category_id);

  // leave description out entirely when it's empty (the model doesn't accept undefined)
  const { description, ...fields } = data;
  const sellingPrice = getSellingPrice(data.price, data.discount);
  const product = await Product.create(description ? { ...fields, description, selling_price: sellingPrice } : { ...fields, selling_price: sellingPrice });
  return Product.findById(product._id).select(PRODUCT_FIELDS).lean();
};

const updateProductService = async (productId: string, data: ProductType) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw badRequest("Invalid product ID");
  }
  await assertCategoryExists(data.category_id);

  // PUT: a missing description removes it ($unset), everything else is overwritten
  const { description, ...rest } = data;
  const fields = { ...rest, selling_price: getSellingPrice(rest.price, rest.discount) };
  const product = await Product.findByIdAndUpdate(
    productId,
    description ? { $set: { ...fields, description } } : { $set: fields, $unset: { description: 1 } },
    { returnDocument: "after", runValidators: true },
  )
    .select(PRODUCT_FIELDS)
    .lean();

  if (!product) {
    throw notFound("Product not found");
  }
  return product;
};

const deleteProductService = async (productId: string) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw badRequest("Invalid product ID");
  }

  const product = await Product.findByIdAndDelete(productId).select("_id").lean();
  if (!product) {
    throw notFound("Product not found");
  }

  // rows that would point at a product that no longer exists
  await Promise.all([
    Cart.deleteMany({ product_id: productId }),
    Wishlist.deleteMany({ product_id: productId }),
    Review.deleteMany({ product_id: productId }),
  ]);
};

export {
  getProductDetailsByIdService,
  getAllProductReviewsByProductIdService,
  addProductReviewService,
  createProductService,
  updateProductService,
  deleteProductService,
};
