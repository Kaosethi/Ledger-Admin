import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Application
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  APP_NAME: z.string().default("STC Ledger"),
  
  // Authentication
  JWT_SECRET: z.string(),
  
  // Password Reset
  RESET_AUTH_TOKEN_EXPIRY_MINUTES: z.coerce.number().positive().default(5),
  OTP_EXPIRY_MINUTES: z.coerce.number().positive().default(15),
  
  // Email
  SENDGRID_API_KEY: z.string().optional(),
  SENDER_EMAIL_ADDRESS: z.string().email().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse({
  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  
  // Application
  NODE_ENV: process.env.NODE_ENV,
  APP_NAME: process.env.APP_NAME,
  
  // Authentication
  JWT_SECRET: process.env.JWT_SECRET,
  
  // Password Reset
  RESET_AUTH_TOKEN_EXPIRY_MINUTES: process.env.RESET_AUTH_TOKEN_EXPIRY_MINUTES,
  OTP_EXPIRY_MINUTES: process.env.OTP_EXPIRY_MINUTES,
  
  // Email
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  SENDER_EMAIL_ADDRESS: process.env.SENDER_EMAIL_ADDRESS,
});
