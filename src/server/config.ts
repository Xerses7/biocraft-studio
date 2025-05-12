export const serverConfig = {
    supabase: {
      url: process.env.SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY,
      dbPassword: process.env.SUPABASE_DB_PASSWORD,
    },
    ai: {
      googleApiKey: process.env.GOOGLE_GENAI_API_KEY,
    },
    server: {
      port: parseInt(process.env.PORT || '3001', 10),
      nodeEnv: process.env.NODE_ENV || 'development',
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:9002',
    }
  };
  
  // Validate config at runtime
  Object.entries(serverConfig).forEach(([category, configs]) => {
    Object.entries(configs).forEach(([key, value]) => {
      if (value === undefined) {
        console.error(`Missing server configuration: ${category}.${key}`);
      }
    });
  });