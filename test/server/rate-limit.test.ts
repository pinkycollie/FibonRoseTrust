import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { rateLimit } from '../../server/middlewares/rate-limit';

describe('Rate Limiting Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      ip: '127.0.0.1',
      connection: {
        remoteAddress: '127.0.0.1'
      } as any
    };
    
    const headerMap = new Map<string, string>();
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn((key: string, value: string) => {
        headerMap.set(key, value);
      })
    };
    
    next = vi.fn();
  });

  it('should allow requests within rate limit', () => {
    const limiter = rateLimit(10, 60000);
    
    limiter(req as Request, res as Response, next);
    
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalledWith(429);
  });

  it('should block requests exceeding rate limit', () => {
    const limiter = rateLimit(2, 60000);
    
    // Make 3 requests (limit is 2)
    limiter(req as Request, res as Response, next);
    limiter(req as Request, res as Response, next);
    limiter(req as Request, res as Response, next);
    
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Too many requests')
      })
    );
  });

  it('should set rate limit headers', () => {
    const limiter = rateLimit(10, 60000);
    
    limiter(req as Request, res as Response, next);
    
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '10');
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(String));
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
  });

  it.skip('should reset count after time window', async () => {
    // Skipping due to timing issues in CI environment
    // This functionality is tested in integration tests
    const limiter = rateLimit(2, 100); // 100ms window
    
    // Make 2 requests (at limit)
    limiter(req as Request, res as Response, next);
    limiter(req as Request, res as Response, next);
    
    // Wait for window to expire plus buffer
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Reset response mock for new request
    const nextSpy = vi.fn();
    const newRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn()
    };
    
    // This request should succeed
    limiter(req as Request, newRes as Response, nextSpy);
    
    expect(nextSpy).toHaveBeenCalled();
  });

  it('should handle different IPs separately', () => {
    const limiter = rateLimit(2, 60000);
    
    const req1 = { ...req, ip: '127.0.0.1' };
    const req2 = { ...req, ip: '192.168.1.1' };
    
    // Make 2 requests from IP1 (at limit)
    limiter(req1 as Request, res as Response, next);
    limiter(req1 as Request, res as Response, next);
    
    // Request from IP2 should still succeed
    const nextSpy = vi.fn();
    limiter(req2 as Request, res as Response, nextSpy);
    
    expect(nextSpy).toHaveBeenCalled();
  });

  it('should set Retry-After header when blocked', () => {
    const limiter = rateLimit(1, 60000);
    
    // Make 2 requests (over limit)
    limiter(req as Request, res as Response, next);
    limiter(req as Request, res as Response, next);
    
    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(String));
  });
});
