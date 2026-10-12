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
