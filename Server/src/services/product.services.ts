import mongoose from "mongoose";
import Category from "../models/category.model.js";
import Product from "../models/product.model.js";
import { badRequest } from "../utils/api-error.js";

const getAllDepartmentsService = async () => {
  const departments = await Product.find()
    .select("_id name slug image")
    .sort({ _id: 1 })
    .lean();

  return departments;
};

export { getAllDepartmentsService };