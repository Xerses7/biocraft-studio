// src/utils/clientConfig.ts
export const clientConfig = {
    apiUrl: process.env.NEXT_PUBLIC_BACKEND_URL || '/api',
    isDevelopment: process.env.NODE_ENV === 'development',
    featureFlags: {
      enableSocialLogin: process.env.NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN === 'true',
      enableRecipeSharing: process.env.NEXT_PUBLIC_ENABLE_RECIPE_SHARING === 'true',
    }
  };