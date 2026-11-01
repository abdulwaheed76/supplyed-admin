import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() { return [{
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: [
            "default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'self'",
            "form-action 'self' https://accounts.google.com",
            `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === "production" ? "" : "'unsafe-eval'"} https://js.stripe.com https://connect-js.stripe.com https://accounts.google.com`,
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", "font-src 'self' data: https://fonts.gstatic.com",
            "img-src 'self' data: blob: https:", "connect-src 'self' https: wss:" + (process.env.NODE_ENV === "production" ? "" : " http://localhost:* ws://localhost:* http://127.0.0.1:* ws://127.0.0.1:*"),
            "frame-src 'self' blob: https://js.stripe.com https://hooks.stripe.com https://connect-js.stripe.com https://connect.stripe.com https://accounts.google.com",
            "worker-src 'self' blob:", "upgrade-insecure-requests",
          ].filter((value) => process.env.NODE_ENV === "production" || value !== "upgrade-insecure-requests").join("; ") },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      }]; },
};

export default nextConfig;
