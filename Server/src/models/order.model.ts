import mongoose from "mongoose";

// snapshot of the address at checkout, so later edits to user_details don't change past orders
const shippingAddressSchema = new mongoose.Schema({
    name: { type: String, required: true },
    house_no: { type: String, required: true },
    address_line_1: { type: String, required: true },
    address_line_2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    pincode: { type: String, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    total_amount: {
        type: Number,
        required: true,
        min: 0,
    },
    shipping_address: {
        type: shippingAddressSchema,
        required: true,
    },
    order_status: {
        type: String,
        enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
        default: "pending",
    },

    gateway_order_id: {
        type: String,
    },
    gateway_payment_id: {
        type: String,
    },
    payment_method: {
        type: String,
    },
    payment_status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
    },
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);

export default Order;
