/*
 * Journal — src/models/user.model.ts
 *
 * Before: Mongoose User model with full_name, email_id (unique, lowercased), phone_no, role (user/admin),
 *   password_hash (select: false, hashed with bcrypt in a pre-save hook), OTP and refresh-token fields.
 *
 * 2026-09-26 (Claude): Replaced full_name with first_name / last_name (maxlength 45 each). email_id
 *   maxlength 322 (320 + buffer). phone_no stored as "<country code>_<10 digits>", e.g. "+91_9876543210",
 *   and validated with a regex. password_hash maxlength 66 (50 + buffer) and no longer required, so
 *   OAuth users can exist without a password (pre-save hook skips hashing when absent). Added
 *   email_verified (default false).
 *
 * 2026-09-26 (Claude): password_hash is required again (no password-less OAuth accounts); removed the
 *   no-password guard from the pre-save hook. maxlength 66 unchanged.
 *
 * 2026-09-26 (Claude): phone_no number part is now 1 to 10 digits instead of exactly 10; still stored
 *   as a string "<dial code>_<digits>".
 *
 * 2026-09-26 (Claude): File renamed from user.models.ts to user.model.ts (singular naming).
 */

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
