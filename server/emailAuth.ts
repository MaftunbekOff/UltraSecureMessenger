
import jwt from "jsonwebtoken";
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import crypto from "crypto";

interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || 'ultra-secure-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export function generateJWT(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET || 'ultra-secure-jwt-secret',
    { expiresIn: '7d' }
  );
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'ultra-secure-jwt-secret') as JWTPayload;
  } catch {
    return null;
  }
}

function generateRandomId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function setupEmailAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Email login endpoint
  app.post('/api/auth/email/login', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: 'Valid email is required' });
      }

      // Upsert user with email
      const user = await storage.upsertUser({
        id: generateRandomId(),
        email,
        firstName: email.split('@')[0],
        lastName: '',
        profileImageUrl: null,
      });

      // Generate JWT token
      const token = generateJWT(user.id, user.email);
      
      // Set token as httpOnly cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'strict'
      });

      res.json({ user, message: 'Login successful' });
    } catch (error) {
      console.error('Email login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req: any, res) => {
    // Clear JWT cookie
    res.clearCookie('auth_token');
    
    // Destroy session
    req.session?.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: 'Session destruction failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const token = req.cookies.auth_token;
  
  if (!token) {
    return res.status(401).json({ message: "No authentication token" });
  }

  const payload = verifyJWT(token);
  if (!payload) {
    return res.status(401).json({ message: "Invalid token" });
  }

  try {
    const user = await storage.getUser(payload.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = { ...user, claims: { sub: user.id } };
    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed" });
  }
};
