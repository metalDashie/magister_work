/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@fullmag/common'],
  env: {
    API_URL: process.env.API_URL || 'http://localhost:10001',
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
