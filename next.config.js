/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['node-cron'],
  webpack: (config, { isServer }) => {
    // Exclude test directory and stress-test.ts from build
    config.resolve.alias = {
      ...config.resolve.alias,
      'test': false,
      './stress-test.ts': false,
      'stress-test.ts': false
    };

    // Handle Node.js built-ins and node: scheme for client-side
    // Only exclude the ones that cause issues, keep crypto available for next-auth
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        util: false,
        stream: false,
        url: false,
        http: false,
        https: false,
        zlib: false,
        querystring: false,
        buffer: false,
        events: false,
        child_process: false,
        cluster: false,
        dgram: false,
        dns: false,
        net: false,
        tls: false,
        tty: false,
      };
    }

    return config;
  }
}

module.exports = nextConfig