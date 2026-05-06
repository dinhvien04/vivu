/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@vivu/types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {
    // typedRoutes disabled while routes are still being scaffolded.
    // Re-enable once route inventory stabilises.
    typedRoutes: false,
  },
};

export default nextConfig;
