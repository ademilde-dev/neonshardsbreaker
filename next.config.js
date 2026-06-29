/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next-build',
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  transpilePackages: ['motion'],
  turbopack: {}, // habilita Turbopack e silencia o erro
};

module.exports = nextConfig;
