import { SessionData } from 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      username: string;
      name: string;
      email: string;
      role: string;
    };
    loginTime?: string;
    clientIP?: string;
    userId?: string;
  }
}