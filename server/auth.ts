import { Express, Request, Response, NextFunction } from "express";
import { auth, requiresAuth } from "express-openid-connect";
import { auth as jwtAuth } from "express-oauth2-jwt-bearer";
import { storage } from "./storage";
import { User } from "@shared/schema";

// Auth0 middleware configuration
const authConfig = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_CLIENT_SECRET!,
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-url.com' 
    : 'http://localhost:5000',
  clientID: process.env.AUTH0_CLIENT_ID!,
  issuerBaseURL: process.env.AUTH0_ISSUER_ID || process.env.AUTH0_DOMAIN,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  authorizationParams: {
    response_type: "code",
    scope: "openid profile email"
  },
};

// JWT validator for API routes
const checkJwt = jwtAuth({
  audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
  issuerBaseURL: process.env.AUTH0_ISSUER_ID || `https://${process.env.AUTH0_DOMAIN}/`,
});

// For TypeScript - extend the Express session with Auth0 user properties
declare module "express-session" {
  interface SessionData {
    user?: {
      nickname: string;
      name: string;
      picture: string;
      updated_at: string;
      email: string;
      email_verified: boolean;
      sub: string;
      sid?: string;
    }
  }
}

// Extend Express request with Auth0 user
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      nickname?: string;
      name?: string;
      email?: string;
      picture?: string;
      sub?: string;
      role?: string; 
    }
  }
}

export function setupAuth(app: Express) {
  // Setup Auth0 authentication middleware
  app.use(auth(authConfig));

  // Profile route - requires authentication
  app.get('/profile', requiresAuth(), (req: Request, res: Response) => {
    res.send(req.oidc.user);
  });

  // Check if user exists in our database after Auth0 authentication
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    if (req.oidc?.user) {
      try {
        // Try to find user by Auth0 sub (subject) identifier
        const auth0Sub = req.oidc.user.sub;
        let user = await findOrCreateUser(req.oidc.user);
        
        // Attach user to request for use in downstream middleware/routes
        req.user = user;
      } catch (error) {
        console.error('Error processing authenticated user:', error);
      }
    }
    next();
  });

  // Helper function to check if user exists or create them
  async function findOrCreateUser(auth0User: any): Promise<User> {
    // Extract Auth0 profile data
    const { sub, email, name, nickname, picture } = auth0User;
    
    // Normalize username from email or nickname
    const username = email?.split('@')[0] || nickname || 'user';
    
    // Check if user exists by Auth0 sub identifier in custom field
    // For demo, we'll use username lookup first 
    let user = await storage.getUserByUsername(username);
    
    if (!user) {
      // Create new user with Auth0 profile data
      user = await storage.createUser({
        username,
        name: name || nickname || username,
        email: email || '',
        password: '', // Not used with Auth0
        emailVerified: auth0User.email_verified || false,
        profilePictureUrl: picture || '',
        // Custom fields for Auth0
        auth0Sub: sub,
        role: 'user' // Default role
      });
      
      // Also create initial trust score for new user
      await storage.createTrustScore({
        userId: user.id,
        score: 1,
        level: 1,
        maxScore: 1
      });
    }
    
    return user;
  }
  
  // API routes protection using JWT
  // This can be used for API endpoints that need to be accessed programmatically
  app.use('/api/protected', checkJwt, (req, res) => {
    res.json({
      message: 'This is a protected API endpoint'
    });
  });
  
  // For protecting specific API routes with JWT validation
  app.use('/api/private', checkJwt, (req, res) => {
    res.json({
      message: 'This is a private API endpoint'
    });
  });

  // Check if user has developer role
  app.get('/api/check-developer', requiresAuth(), (req, res) => {
    if (req.user?.role === 'developer' || req.user?.role === 'admin') {
      return res.json({ isDeveloper: true });
    }
    res.json({ isDeveloper: false });
  });
}

// Middleware for protecting developer routes
export function requiresDeveloper(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role === 'developer' || req.user?.role === 'admin') {
    return next();
  }
  
  // If not authenticated or not a developer, redirect to login
  if (!req.oidc.isAuthenticated()) {
    return res.redirect('/login');
  }
  
  // If authenticated but not a developer, show access denied
  res.status(403).json({ 
    error: 'Access denied',
    message: 'You need developer permissions to access this resource'
  });
}