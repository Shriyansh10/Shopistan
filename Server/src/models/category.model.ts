/*
 * Journal — src/models/category.model.ts
 *
 * Before: Category schema with a unique, trimmed name and timestamps.
 *
 * 2026-10-05 (Claude): Added required parent_id referencing Department, so each category belongs to a
 *   top-level department.
 */

import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    // the department this category belongs to
    parent_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: true,
        index: true,
    },
}, { timestamps: true });

const Category = mongoose.model("Category", categorySchema);

export default Category;
