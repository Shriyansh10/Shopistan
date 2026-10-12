import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true,
    },

    comment: {
        type: String,
        trim: true,
    },
    // image URLs
    images: {
        type: [String],
        default: [],
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
}, { timestamps: true });

// one review per user per product
reviewSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
