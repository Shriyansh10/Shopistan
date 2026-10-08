/*
 * Journal — src/services/auth.service.ts
 *
 * 2026-09-26 (Claude): Created. registerUser() POSTs to ${VITE_BACKEND_URL}/api/auth/register with cookies
 *   (credentials: "include"), drops the client-only `terms` field, strips spaces/dashes from the phone,
 *   and throws the server's `message` on a non-2xx response so the form can show it.
 *
 * 2026-09-26 (Claude): Body now sends first_name / last_name instead of full_name, and phone_no as
 *   "<country_code>_<number>", e.g. "+91_9876543210".
 *
 * 2026-09-26 (Claude): The form now gives an ISO country (e.g. "IN"); its dial code is looked up
 *   from lib/countries.ts to build phone_no. The wire format is unchanged.
 *
 * 2026-09-26 (Claude): Switched from fetch to the shared axios instance (lib/api.ts). Returns the
 *   server's ApiSuccess envelope; failures arrive as ApiError (message + statusCode) via the interceptor.
 *   Request body unchanged.
 *
 * 2026-09-29 (Claude): Added loginUser() — POSTs { email_id, password } to /auth/login.
 *   NOTE: the server has no /auth/login route yet; this will 404 until it's added.
 *
 * 2026-09-30 (Claude): Added getProfile() — GET /auth/profile (needs the accessToken cookie).
 *
 * 2026-10-08 (Claude): Added logoutUser() — POST /auth/logout (server clears both auth cookies).
 */

import type { LoginInput, RegisterInput } from "../schemas/auth.schema";
import { getCountry } from "../lib/countries";
import { api } from "../lib/api";
import type { ApiSuccess } from "../lib/api_response";

export async function registerUser(data: RegisterInput) {
  const { first_name, last_name, email_id, country, phone_no, password } = data;
  const res = await api.post<ApiSuccess<unknown>>("/auth/register", {
    first_name,
    last_name,
    email_id,
    phone_no: `${getCountry(country).dial}_${phone_no}`,
    password,
  });
  return res.data;
}

export async function sendOtp(email_id: string) {
    const res = await api.post<ApiSuccess<unknown>>("/auth/send-otp", { email_id });
    return res.data;
}

export async function verifyOtp(email_id: string, otp: string) {
    const res = await api.post<ApiSuccess<unknown>>("/auth/verify-otp", { email_id, otp });
    return res.data;
}

export async function loginUser(data: LoginInput) {
  const res = await api.post<ApiSuccess<unknown>>("/auth/login", data);
  return res.data;
}

export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email_id: string;
  phone_no?: string;
};

export async function getProfile() {
  const res = await api.get<ApiSuccess<Profile>>("/auth/profile");
  return res.data;
}

export async function logoutUser() {
  const res = await api.post<ApiSuccess<unknown>>("/auth/logout");
  return res.data;
}
