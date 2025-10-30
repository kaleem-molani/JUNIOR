/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Exclude test directory from build
    config.resolve.alias = {
      ...config.resolve.alias,
      'test': false
    };
    return config;
  }
}

module.exports = nextConfig