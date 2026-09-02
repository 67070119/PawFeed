const backendInternalUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:3001';

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendInternalUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendInternalUrl}/uploads/:path*`,
      },
      {
        source: '/backend-health/:path*',
        destination: `${backendInternalUrl}/health/:path*`,
      },
    ];
  },
};

export default nextConfig;
