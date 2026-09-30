import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: 1,
    },
}, { timestamps: true });

// one cart row per product per user; bump quantity instead of adding duplicates
cartSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
