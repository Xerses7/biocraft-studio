import type {NextConfig} from 'next';

import { validateEnv } from './src/utils/validateEnv';

const errors = validateEnv();
if (errors.length > 0) {
  console.error('Environment validation failed:');
  errors.forEach(err => console.error(`- ${err}`));
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Build failed due to environment validation errors');
  }
}

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true, // TODO: delete in production
  },
  eslint: {
    ignoreDuringBuilds: true, // TODO: delete in production
  },
};

export default nextConfig;
