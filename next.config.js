/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add experimental configuration for Next.js App Router
  experimental: {
    // Suppress the dynamic route params warning
    allowMiddlewareResponseBody: true,
    // Add the suppress dynamic params warning flag
    appRouteSyncDynamicParamsFallback: true
  }
}

module.exports = nextConfig 