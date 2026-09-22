/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXTAUTH_SECRET:
      process.env.NEXTAUTH_SECRET || "aidlearn-assessment-platform-secret-super-key-2026",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
