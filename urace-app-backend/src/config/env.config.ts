import dotenv from "dotenv";
import path from "path";
import { createLogger } from '../utils/logger';

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

interface EnvConfig {
  // Database
  MONGODB_URI: string;
  DB_NAME: string;
  
  // Redis
  REDIS_URL: string;
  
  // JWT
  JWT_SECRET: string;

  //Google OAyth
  GOOGLE_WEB_CLIENT_ID: string;
  
  // Admin API
  ADMIN_API_KEY: string;
  
  // Strava API
  STRAVA_CLIENT_ID: string;
  STRAVA_CLIENT_SECRET: string;
  STRAVA_REDIRECT_URI: string;
  STRAVA_WEBHOOK_VERIFY_TOKEN: string;
  
  // Email
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  FROM_EMAIL: string;
  
  // Frontend
  FRONTEND_URL: string;
}

const createConfig = (): EnvConfig => {
  return {
    // Database
    MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017',
    DB_NAME: process.env.DB_NAME || 'urace',
    
    // Redis
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    
    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',

    //Gg oath
    GOOGLE_WEB_CLIENT_ID: '710979661199-c2flpt2grsru28pde84iv56asv2el4mo.apps.googleusercontent.com',
    
    // Admin API
    ADMIN_API_KEY: process.env.ADMIN_API_KEY || 'dev-api-key-change-in-production',
    
    // Strava API
    STRAVA_CLIENT_ID: process.env.STRAVA_CLIENT_ID || '',
    STRAVA_CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET || '',
    STRAVA_REDIRECT_URI: process.env.STRAVA_REDIRECT_URI || '',
    STRAVA_WEBHOOK_VERIFY_TOKEN: process.env.STRAVA_WEBHOOK_VERIFY_TOKEN || '',
    
    // Email
    SMTP_HOST: process.env.SMTP_HOST || '',
    SMTP_PORT: process.env.SMTP_PORT || '587',
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    FROM_EMAIL: process.env.FROM_EMAIL || '',
    
    // Frontend
    FRONTEND_URL: process.env.FRONTEND_URL || 'uracefrontend://strava-callback',
  };
};

const validateConfig = (config: EnvConfig): void => {
  const requiredVars = [
    'MONGODB_URI',
    'DB_NAME',
    'JWT_SECRET'
  ];
  
  const missingVars = requiredVars.filter(varName => {
    const value = config[varName as keyof EnvConfig];
    return !value || value === '';
  });
  
  if (missingVars.length > 0) {
    const configLogger = createLogger('config');
    configLogger.warn('Missing required environment variables', 'validateEnvironment', { missingVars });
  }
};

const config = createConfig();
validateConfig(config);

export default config;