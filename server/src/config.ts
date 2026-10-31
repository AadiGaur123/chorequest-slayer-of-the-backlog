import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  demoMode: process.env.DEMO_MODE !== 'false', // Defaults to true for out-of-the-box evaluator testing!
  sessionSecret: process.env.SESSION_SECRET || 'hackathon-super-secret-key-change-in-prod',
  
  // Minimal OAuth scopes for least privilege security
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/api/auth/google/callback',
    scopes: ['https://www.googleapis.com/auth/gmail.modify'],
  },
  
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:4000/api/auth/github/callback',
    scopes: ['repo', 'workflow'],
  },
  
  queue: {
    batchWindowMs: 1500, // Debounce window to combine fast combo attacks
    maxRetries: 3,
    concurrency: 5,
  }
};
