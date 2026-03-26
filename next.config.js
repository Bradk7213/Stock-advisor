/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Allow images from external domains if needed
  images: {
    domains: [],
  },
  // Ensure API routes have sufficient timeout for AI calls
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

module.exports = nextConfig;
