import { z } from "zod";

// src/validators/auth.validator.ts  (or dto/auth.dto.ts)
export const registerDto = z.object({
  first_name: z.string().trim().min(1).max(45),
  last_name: z.string().trim().min(1).max(45),
  email_id: z.email().max(320),
  password: z.string().min(8).max(50),
  phone_no: z.string().max(15),
});
export type RegisterType = z.infer<typeof registerDto>; 

export const sendOtpDto = z.object({
    email_id: z.email().max(320),
});
export type SendOtpType = z.infer<typeof sendOtpDto>;

export const verifyOtpDto = z.object({
    email_id: z.email().max(320),
    otp: z.string().length(6), // Assuming OTP is a 6-digit string
});
export type VerifyOtpType = z.infer<typeof verifyOtpDto>;

export const loginDto = z.object({
    email_id: z.email().max(320),
    password: z.string().min(1), // Password must be non-empty
});
export type LoginType = z.infer<typeof loginDto>;
