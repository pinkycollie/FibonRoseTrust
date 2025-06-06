import { Request, Response, NextFunction } from "express";

/**
 * CORS middleware to allow cross-origin requests from approved domains
 */
export const corsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // List of allowed origins
  const allowedOrigins = [
    "https://fibonrose.mbtquniverse.com",
    "http://localhost:3000",
    "http://localhost:5000",
  ];

  // Get the origin from the request headers
  const origin = req.headers.origin;

  // Check if the origin is in our list of allowed origins
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    // For requests without an origin header (like server-to-server)
    // or for origins not in our list, use a default setting
    // You can choose to either allow or reject these
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  // Allow credentials (cookies, authorization headers, etc.)
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Allow these HTTP methods
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );

  // Allow these headers
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key",
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Continue to the next middleware
  next();
};
