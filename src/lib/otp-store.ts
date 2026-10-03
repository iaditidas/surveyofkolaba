export interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
  name?: string;
  email?: string;
}

declare global {
  var __OTP_STORE__: Record<string, OtpEntry> | undefined;
}

if (!global.__OTP_STORE__) {
  global.__OTP_STORE__ = {};
}

export const otpStore = global.__OTP_STORE__;
