import { createMDX } from 'fumadocs-mdx/next';
import path from 'path';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  allowedDevOrigins: [
      'http://education.centralindia.cloudapp.azure.com',
      'https://education.centralindia.cloudapp.azure.com',
    ],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve('./src'),
    };
    return config;
  },
  compiler:{
    removeConsole:process.env.NODE_ENV === 'production'
  },
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*', 
        destination: 'https://us.i.posthog.com/:path*',
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default withMDX(config);