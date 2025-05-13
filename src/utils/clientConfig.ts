// src/utils/clientConfig.ts
export const clientConfig = {
  apiUrl: process.env.NEXT_PUBLIC_BACKEND_URL || '/api',
  isDevelopment: process.env.NODE_ENV === 'development',
  featureFlags: {
    enableSocialLogin: process.env.NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN === 'true',
    enableRecipeSharing: process.env.NEXT_PUBLIC_ENABLE_RECIPE_SHARING === 'true',
  },
  security: {
    // Security settings for cookie-based authentication
    cookieConfig: {
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    csrfEnabled: true
  }
};