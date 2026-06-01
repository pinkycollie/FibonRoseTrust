import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { User } from "@shared/schema";

const roleMiddleware = (requiredAdmin) => (req, res, next) => {
  if (req.user.role !== required) return res.status(403).json({ message: 'Access forbidden' });
  next();
};
export function setupAuth(app: Express) {
  // Simple authentication placeholder
  console.log('Auth setup simplified for development');
}