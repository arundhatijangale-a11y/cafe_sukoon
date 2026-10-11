/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/signin', destination: '/login' },
      { source: '/register', destination: '/signup' }
    ];
  }
};

export default nextConfig;
