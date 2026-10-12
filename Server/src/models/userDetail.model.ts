import mongoose from "mongoose";

const userDetailSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },

    name: {
        type: String,
        required: true,
        trim: true,
    },

    house_no: {
        type: String,
        required: true,
        trim: true,
    },
    address_line_1: {
        type: String,
        required: true,
        trim: true,
    },
    address_line_2: {
        type: String,
        trim: true,
    },
    city: {
        type: String,
        required: true,
        trim: true,
    },
    state: {
        type: String,
        required: true,
        trim: true,
    },
    country: {
        type: String,
        required: true,
        trim: true,
    },
    pincode: {
        type: String,
        required: true,
        trim: true,
    },

    is_default: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const UserDetail = mongoose.model("UserDetail", userDetailSchema);

export default UserDetail;
