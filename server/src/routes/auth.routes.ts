import { Router, Request, Response } from 'express';
import { config } from '../config.js';

export const authRouter = Router();

// Returns auth status and mode (Demo vs Production)
authRouter.get('/status', (_req: Request, res: Response) => {
  res.json({
    authenticated: true,
    user: {
      id: 'hero-1337',
      name: 'Pixel Slayer',
      avatar: '🗡️',
    },
    demoMode: config.demoMode,
    providers: {
      google: { connected: !config.demoMode && !!config.google.clientId },
      github: { connected: !config.demoMode && !!config.github.clientId },
    },
  });
});

// OAuth initiate endpoints
authRouter.get('/google', (_req: Request, res: Response) => {
  if (config.demoMode) {
    return res.redirect(`${config.clientUrl}?auth_success=demo_mode`);
  }
  const scope = encodeURIComponent(config.google.scopes.join(' '));
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.google.clientId}&redirect_uri=${encodeURIComponent(
    config.google.redirectUri
  )}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
  return res.redirect(url);
});

authRouter.get('/google/callback', async (_req: Request, res: Response) => {
  // In real OAuth flow, code is exchanged here for tokens and saved in secure HttpOnly cookie
  res.redirect(`${config.clientUrl}?auth_success=google`);
});
