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
