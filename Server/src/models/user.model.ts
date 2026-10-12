import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 45,
    },
    last_name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 45,
    },
    email_id: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        maxlength: 322,
    },
    email_verified: {
        type: Boolean,
        default: false,
    },
    phone_no: { // +<dial code>_<up to 10 digits>, e.g. +91_9876543210
        type: String,
        trim: true,
        match: /^\+[1-9]\d{0,3}_\d{1,10}$/,
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },

    // sensitive fields are excluded from queries by default; use .select("+field") to read them
    password_hash: {
        type: String,
        required: true,
        maxlength: 66,
        select: false,
    },
    hashed_verification_otp: {
        type: String,
        select: false,
    },
    verification_otp_expires_at: {
        type: Date,
        select: false,
    },

    // stored encrypted
    hashed_refresh_token: {
        type: String,
        select: false,
    },
}, { timestamps: true });

userSchema.pre("save", async function () {
  if (this.isModified("password_hash")) {
    this.password_hash = await bcrypt.hash(this.password_hash, 10);
  }
});

const User = mongoose.model("User", userSchema);

export default User;
