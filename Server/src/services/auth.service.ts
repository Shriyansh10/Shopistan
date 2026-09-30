/*
 * Journal — src/services/auth.service.ts
 *
 * Before: auth services — register, send OTP (bcrypt-hashed, 5-minute expiry, emailed via Resend),
 *   verify OTP, and email/password login returning access + refresh tokens.
 *
 * 2026-09-29 (Claude): verifyOtpService now also selects verification_otp_expires_at. It is select: false
 *   in the model, so it came back undefined and every OTP — even a correct one — was rejected as invalid.
 */

import type { RegisterType } from "../dto/auth.dto.js";
import User from "../models/user.model.js";
import { badRequest, conflict, unauthorized } from "../utils/api-error.js";
import { Resend } from "resend";
import bcrypt from "bcrypt";
import { generateAuthTokens, hashToken } from "../utils/jwt.js";

const registerUserUsingEmailAndPasswordService = async (
  userData: RegisterType,
) => {
  const { first_name, last_name, email_id, password, phone_no } = userData;
  const existingUser = await User.findOne({ email_id });

  // If the user already exists and is verified, throw a conflict error
  if (existingUser && existingUser.email_verified) {
    throw conflict("Email already exists");
  }

  // If the user exists but is not verified, we can update their details and resend the OTP
  if (existingUser && !existingUser.email_verified) {
    existingUser.first_name = first_name;
    existingUser.last_name = last_name;
    existingUser.password_hash = password;
    existingUser.phone_no = phone_no;

    await existingUser
      .save()
      .then(async () => {
        await sendOtpService(email_id);
      })
      .catch((error) => {
        console.error("Error saving new user:", error);
        throw conflict("Error saving new user");
      });

    const result = {
      id: existingUser._id,
      first_name: existingUser.first_name,
      last_name: existingUser.last_name,
      email_id: existingUser.email_id,
      phone_no: existingUser.phone_no,
    };

    // Call the sendOtpService to send OTP after successful registration
    return result;
  }

  // If the user does not exist, create a new user and send OTP
  const newUser = new User({
    first_name,
    last_name,
    email_id,
    password_hash: password, // Assuming you will hash the password before saving
    phone_no,
  });
  await newUser
    .save()
    .then(() => {
      sendOtpService(email_id);
    })
    .catch((error) => {
      console.error("Error saving new user:", error);
      throw conflict("Error saving new user");
    });

  const result = {
    id: newUser._id,
    first_name: newUser.first_name,
    last_name: newUser.last_name,
    email_id: newUser.email_id,
    phone_no: newUser.phone_no,
  };

  // Call the sendOtpService to send OTP after successful registration
  return result;
};

const sendOtpService = async (email_id: string) => {
  // Check if the user exists
  const existingUser = await User.findOne({ email_id });
  if (!existingUser) {
    throw conflict("User with this email does not exist - sendOtpService");
  }

  // Generate OTP (for simplicity, using a random 6-digit number)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await storeOtpInSession(email_id, otp); // Store the OTP in session or database for later verification

  const resend = new Resend(process.env.RESEND_API_KEY as string);

  console.log(`Sending OTP to email ${email_id}`);

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: "shriyansh.agarwal.dev@gmail.com",
    subject: "Your OTP Code",
    html: `<p>Your Shopistan's verification OTP code for email ${email_id} is: <strong>${otp}</strong>
    <p>This code will expire in 5 minutes.</p>
    </p>`,
  });
};

const storeOtpInSession = async (email_id: string, otp: string) => {
  // Store the OTP in the user's session
  // This is a placeholder implementation; you would typically use a session store or database
  const existingUser = await User.findOne({ email_id });

  if (!existingUser) {
    throw conflict("User with this email does not exist - storeOtpInSession");
  }
  existingUser.hashed_verification_otp = await bcrypt.hash(otp, 10);
  existingUser.verification_otp_expires_at = new Date(
    Date.now() + 5 * 60 * 1000,
  ); // OTP expires in 5 minutes

  console.log("OTP stored in session for user: ", existingUser.email_id);
  await existingUser.save();
};

const verifyOtpService = async (email_id: string, otp: string) => {
  // both fields are select: false in the model, so they must be requested explicitly
  const existingUser = await User.findOne({ email_id }).select(
    "+hashed_verification_otp +verification_otp_expires_at",
  );

  if (!existingUser) {
    throw conflict("User with this email does not exist - verifyOtpService");
  }
  const isMatch = await bcrypt.compare(
    otp,
    existingUser.hashed_verification_otp as string,
  );
  console.log("OTP match result for ", existingUser.email_id, ":", isMatch);

  if (
    !isMatch ||
    !existingUser.verification_otp_expires_at ||
    existingUser.verification_otp_expires_at < new Date()
  ) {
    throw badRequest("Invalid OTP");
  }

  // If OTP is valid, you might want to mark the user as verified
  existingUser.email_verified = true;
  existingUser.hashed_verification_otp = null; // Clear the OTP after successful verification
  existingUser.verification_otp_expires_at = null; // Clear the expiry time after successful verification
  await existingUser.save();

  console.log("User email verified successfully for ", existingUser.email_id);
  return { success: true };
};

const loginUserWithEmailAndPasswordService = async (
  email_id: string,
  password: string,
) => {
  const existingUser = await User.findOne({ email_id }).select(
    "+password_hash +hashed_refresh_token",
  );
  console.log(
    "Login attempt for email:",
    existingUser?.email_id,
    "User found:",
    !!existingUser,
  );

  if (!existingUser || !existingUser.email_verified) {
    throw unauthorized(`Invalid email or password`);
  }

  const isMatch = await bcrypt.compare(
    password,
    existingUser.password_hash as string,
  );

  if (!isMatch) {
    throw unauthorized("Invalid email or password");
  }

  const { accessToken, refreshToken } = await issueTokensForUser(
    existingUser._id.toString(),
  );

  return { success: true, accessToken, refreshToken };
};

const getProfileService = async (userId: string) => {
  const existingUser = await User.findById(userId);
  if (!existingUser) {
    throw conflict("User not found");
  }
  return {
    id: existingUser._id,
    first_name: existingUser.first_name,
    last_name: existingUser.last_name,
    email_id: existingUser.email_id,
    phone_no: existingUser.phone_no,
  };
};

const issueTokensForUser = async (userId: string) => {
  const existingUser = await User.findById(userId).select(
    "+hashed_refresh_token",
  );
  if (!existingUser) {
    throw conflict("User not found");
  }
  const { accessToken, refreshToken } = generateAuthTokens({
    id: existingUser._id.toString(),
    role: existingUser.role as "user" | "admin",
  });

  existingUser.hashed_refresh_token = await hashToken(refreshToken);
  await existingUser.save();
  return { accessToken, refreshToken };
};

const validateRefreshTokenForUser = async (refreshToken: string, userId: string) => {
    const hashedRefreshToken = await hashToken(refreshToken);

    const existingUser = await User.findById(userId).select('+hashed_refresh_token');
    if (!existingUser) {
        throw conflict("User not found");
    }

    if (existingUser.hashed_refresh_token !== hashedRefreshToken) {
        throw unauthorized("Invalid refresh token");
    }
};

const clearRefreshTokenForUser = async (userId: string) => {
    const existingUser = await User.findById(userId).select('+hashed_refresh_token');
    if (!existingUser) {
        throw conflict("User not found");
    }

    existingUser.hashed_refresh_token = null;
    await existingUser.save();
}

export {
  registerUserUsingEmailAndPasswordService,
  sendOtpService,
  verifyOtpService,
  getProfileService,
  loginUserWithEmailAndPasswordService,
  issueTokensForUser,
  validateRefreshTokenForUser,
  clearRefreshTokenForUser,
};
