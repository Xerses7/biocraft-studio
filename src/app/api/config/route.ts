// src/app/api/config/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // Only expose safe configuration values
  const publicConfig = {
    apiUrl: process.env.NEXT_PUBLIC_BACKEND_URL,
    features: {
      enableSocialLogin: process.env.NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN === 'true',
      enableRecipeSharing: process.env.NEXT_PUBLIC_ENABLE_RECIPE_SHARING === 'true',
    },
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    buildId: process.env.NEXT_PUBLIC_BUILD_ID || 'development',
  };

  return NextResponse.json(publicConfig);
}