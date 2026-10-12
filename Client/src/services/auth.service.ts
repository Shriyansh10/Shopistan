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
  role: "user" | "admin";
};

export async function getProfile() {
  const res = await api.get<ApiSuccess<Profile>>("/auth/profile");
  return res.data;
}

export async function logoutUser() {
  const res = await api.post<ApiSuccess<unknown>>("/auth/logout");
  return res.data;
}
