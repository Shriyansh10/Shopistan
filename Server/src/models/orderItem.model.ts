import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
        index: true,
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },

    // copied from the product at checkout so the order keeps the price paid
    product_name: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    unit_price: {
        type: Number,
        required: true,
        min: 0,
    },
}, { timestamps: true });

const OrderItem = mongoose.model("OrderItem", orderItemSchema);

export default OrderItem;
