
import jwt from "jsonwebtoken";
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
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
      
      console.log('Login attempt for email:', email);
      
      if (!email || !email.includes('@') || email.length < 5) {
        console.log('Invalid email format:', email);
        return res.status(400).json({ message: 'To\'g\'ri email manzili talab qilinadi' });
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log('Email regex validation failed:', email);
        return res.status(400).json({ message: 'Email formati noto\'g\'ri' });
      }

      // Check if user already exists
      let user = await db.select().from(users).where(eq(users.email, email)).then(rows => rows[0]);
      
      if (!user) {
        // Create new user if doesn't exist
        user = await storage.upsertUser({
          id: generateRandomId(),
          email,
          firstName: email.split('@')[0],
          lastName: '',
          displayName: email.split('@')[0],
          profileImageUrl: null,
        });
      }

      console.log('User created/found:', user.id);

      // Generate JWT token
      const token = generateJWT(user.id, user.email);
      
      // Set token as httpOnly cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax', // Changed from strict to lax for better compatibility
        path: '/'
      });

      console.log('Login successful for user:', user.id);
      res.json({ user, message: 'Muvaffaqiyatli kirish' });
    } catch (error) {
      console.error('Email login error:', error);
      res.status(500).json({ message: 'Server xatoligi. Iltimos, qayta urinib ko\'ring.' });
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
  const token = req.cookies?.auth_token;
  
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
