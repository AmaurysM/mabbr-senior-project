import { z, object, string } from "zod";

const baseIdSchema = z.string().cuid();
const timestampSchema = z.date();

const getPasswordSchema = (type: "password" | "confirmPassword") =>
  string({ required_error: `${type} is required` })
    .min(8, `${type} must be atleast 8 characters`)
    .max(32, `${type} can not exceed 32 characters`);

const getEmailSchema = () =>
  string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Invalid email");

const getNameSchema = () =>
  string({ required_error: "Name is required" })
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters");

  export const signUpSchema = z
    .object({
      name: getNameSchema(),
      email: getEmailSchema(),
      password: getPasswordSchema("password"),
      confirmPassword: getPasswordSchema("confirmPassword"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    });

export const signInSchema = object({
  email: getEmailSchema(),
  password: getPasswordSchema("password"),
});

export const forgotPasswordSchema = object({
  email: getEmailSchema(),
});

export const resetPasswordSchema = object({
  password: getPasswordSchema("password"),
  confirmPassword: getPasswordSchema("confirmPassword"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


// User Schema
export const userSchema = z.object({
  id: baseIdSchema,
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean().default(false),
  image: z.string().nullable(),
  premium: z.boolean().default(false),
  role: z.string().default("user"),
  banned: z.boolean().default(false),
  banReason: z.string().nullable(),
  banExpires: z.number().nullable(), // Unix timestamp
  balance: z.number().default(0.0),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

// Friendship Schema
export const friendshipSchema = z.object({
  id: baseIdSchema,
  user1Id: z.string(),
  user2Id: z.string(),
  createdAt: timestampSchema,
});

// Stock Schema
export const stockSchema = z.object({
  id: baseIdSchema,
  userId: z.string(),
  symbol: z.string(),
  quantity: z.number().int(),
  avgPrice: z.number(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

// Transaction Schema
export const transactionSchema = z.object({
  id: baseIdSchema,
  userId: z.string(),
  stockSymbol: z.string(),
  type: z.enum(["BUY", "SELL"]),
  quantity: z.number().int(),
  price: z.number(),
  totalCost: z.number(),
  timestamp: timestampSchema,
  status: z.string().default("COMPLETED"),
});

// LootBox Schema
export const lootBoxSchema = z.object({
  id: baseIdSchema,
  userId: z.string(),
  type: z.string(),
  opened: z.boolean().default(false),
  reward: z.any().nullable(), // Using any for Json type
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

// Session Schema
export const sessionSchema = z.object({
  id: baseIdSchema,
  userId: z.string(),
  token: z.string(),
  expiresAt: timestampSchema,
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  impersonatedBy: z.string().nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

// Account Schema
export const accountSchema = z.object({
  id: baseIdSchema,
  userId: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  accessToken: z.string().nullable(),
  refreshToken: z.string().nullable(),
  accessTokenExpiresAt: timestampSchema.nullable(),
  refreshTokenExpiresAt: timestampSchema.nullable(),
  scope: z.string().nullable(),
  password: z.string().nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

// Verification Schema
export const verificationSchema = z.object({
  id: baseIdSchema,
  identifier: z.string(),
  value: z.string(),
  expiresAt: timestampSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

// Create input schemas (for creating new records)
export const createUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const createStockSchema = stockSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const createTransactionSchema = transactionSchema.omit({
  id: true,
  timestamp: true,
  status: true,
});

export const createLootBoxSchema = lootBoxSchema.omit({
  id: true,
  opened: true,
  reward: true,
  createdAt: true,
  updatedAt: true,
});

export const createSessionSchema = sessionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const createAccountSchema = accountSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const createVerificationSchema = verificationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Update input schemas (for updating existing records)
export const updateUserSchema = createUserSchema.partial();
export const updateStockSchema = createStockSchema.partial();
export const updateTransactionSchema = createTransactionSchema.partial();
export const updateLootBoxSchema = createLootBoxSchema.partial();
export const updateSessionSchema = createSessionSchema.partial();
export const updateAccountSchema = createAccountSchema.partial();
export const updateVerificationSchema = createVerificationSchema.partial();

// Type definitions
export type User = z.infer<typeof userSchema>;
export type Friendship = z.infer<typeof friendshipSchema>;
export type Stock = z.infer<typeof stockSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type LootBox = z.infer<typeof lootBoxSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type Account = z.infer<typeof accountSchema>;
export type Verification = z.infer<typeof verificationSchema>;

// Create input types
export type CreateUser = z.infer<typeof createUserSchema>;
export type CreateStock = z.infer<typeof createStockSchema>;
export type CreateTransaction = z.infer<typeof createTransactionSchema>;
export type CreateLootBox = z.infer<typeof createLootBoxSchema>;
export type CreateSession = z.infer<typeof createSessionSchema>;
export type CreateAccount = z.infer<typeof createAccountSchema>;
export type CreateVerification = z.infer<typeof createVerificationSchema>;

// Update input types
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UpdateStock = z.infer<typeof updateStockSchema>;
export type UpdateTransaction = z.infer<typeof updateTransactionSchema>;
export type UpdateLootBox = z.infer<typeof updateLootBoxSchema>;
export type UpdateSession = z.infer<typeof updateSessionSchema>;
export type UpdateAccount = z.infer<typeof updateAccountSchema>;
export type UpdateVerification = z.infer<typeof updateVerificationSchema>;
