import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

// export const authClient = createAuthClient({
//   baseURL:
//     process.env.NODE_ENV === "production"
//       ? process.env.BETTER_AUTH_URL || "https://www.mabbr.net/api/auth"
//       : process.env.BETTER_AUTH_URL || "http://localhost:3000/api/auth",
//   plugins: [adminClient()],
// });
export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [adminClient()],
});