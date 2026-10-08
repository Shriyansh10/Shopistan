/*
 * Journal — src/models/department.model.ts
 *
 * 2026-10-05 (Claude): Created. Top-level grouping above Category (e.g. "Video Games" groups the
 *   PS5 / Xbox / Switch categories). Categories point here via Category.parent_id.
 */

import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    // URL-friendly name, e.g. "home-and-kitchen"
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    image: {
        type: String,
    },
}, { timestamps: true });

const Department = mongoose.model("Department", departmentSchema);

export default Department;
