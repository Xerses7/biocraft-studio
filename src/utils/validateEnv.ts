// src/utils/validateEnv.ts
type EnvVar = {
    name: string;
    required: boolean;
    serverOnly?: boolean;
    pattern?: RegExp;
    default?: string;
  }
  
  export const requiredEnvVars: EnvVar[] = [
    { name: 'NEXT_PUBLIC_BACKEND_URL', required: true, pattern: /^https?:\/\// },
    { name: 'GOOGLE_GENAI_API_KEY', required: true, serverOnly: true },
    { name: 'SUPABASE_URL', required: true, serverOnly: true },
    { name: 'SUPABASE_ANON_KEY', required: true, serverOnly: true },
    { name: 'SUPABASE_DB_PASSWORD', required: true, serverOnly: true }
  ];
  
  export function validateEnv(): string[] {
    const errors: string[] = [];
  
    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar.name];
      
      if (envVar.required && !value) {
        errors.push(`Missing required environment variable: ${envVar.name}`);
        continue;
      }
  
      if (value && envVar.pattern && !envVar.pattern.test(value)) {
        errors.push(`Environment variable ${envVar.name} does not match required pattern`);
      }
  
      // In browser context, check for server-only vars exposure
      if (typeof window !== 'undefined' && envVar.serverOnly && value) {
        console.error(`WARNING: Server-only environment variable ${envVar.name} might be exposed to the client`);
      }
    }
  
    return errors;
  }