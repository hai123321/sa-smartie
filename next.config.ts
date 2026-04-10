import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['levelup', 'leveldown'],
};

export default nextConfig;
