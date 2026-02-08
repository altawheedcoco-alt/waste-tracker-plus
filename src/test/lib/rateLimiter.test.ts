import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimiter, RATE_LIMITS } from '@/lib/rateLimiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    // Reset the rate limiter before each test
    rateLimiter.reset('test');
  });

  it('allows requests within limit', () => {
    const config = { maxRequests: 5, windowMs: 60000, identifier: 'test' };
    
    for (let i = 0; i < 5; i++) {
      const result = rateLimiter.checkLimit(config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4 - i);
    }
  });

  it('blocks requests exceeding limit', () => {
    const config = { maxRequests: 3, windowMs: 60000, identifier: 'test_block' };
    
    // Use up all allowed requests
    for (let i = 0; i < 3; i++) {
      rateLimiter.checkLimit(config);
    }
    
    // This should be blocked
    const result = rateLimiter.checkLimit(config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.resetIn).toBeGreaterThan(0);
  });

  it('resets after window expires', async () => {
    const config = { maxRequests: 2, windowMs: 100, identifier: 'test_reset' };
    
    // Use up all requests
    rateLimiter.checkLimit(config);
    rateLimiter.checkLimit(config);
    
    let result = rateLimiter.checkLimit(config);
    expect(result.allowed).toBe(false);
    
    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 150));
    
    result = rateLimiter.checkLimit(config);
    expect(result.allowed).toBe(true);
  });

  it('tracks different identifiers separately', () => {
    const config1 = { maxRequests: 1, windowMs: 60000, identifier: 'user1' };
    const config2 = { maxRequests: 1, windowMs: 60000, identifier: 'user2' };
    
    rateLimiter.checkLimit(config1);
    const result1 = rateLimiter.checkLimit(config1);
    expect(result1.allowed).toBe(false);
    
    const result2 = rateLimiter.checkLimit(config2);
    expect(result2.allowed).toBe(true);
  });

  it('RATE_LIMITS has correct configuration', () => {
    expect(RATE_LIMITS.AUTH.maxRequests).toBe(5);
    expect(RATE_LIMITS.AI_ASSISTANT.maxRequests).toBe(20);
    expect(RATE_LIMITS.PUBLIC_API.maxRequests).toBe(10);
  });
});
