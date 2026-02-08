import { describe, it, expect, vi, beforeEach } from 'vitest';
import { canUseAI, getFallbackResponse, handleAIRequest } from '@/lib/aiFallback';
import { rateLimiter } from '@/lib/rateLimiter';

// Mock dependencies
vi.mock('@/lib/errorTracker', () => ({
  trackError: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

describe('AI Fallback System', () => {
  beforeEach(() => {
    rateLimiter.reset('ai_test_user');
  });

  describe('canUseAI', () => {
    it('allows requests within limit', () => {
      const result = canUseAI('test_user');
      expect(result.allowed).toBe(true);
    });
  });

  describe('getFallbackResponse', () => {
    it('returns rate limit response', () => {
      const result = getFallbackResponse('test', 'rate_limit');
      expect(result.isFallback).toBe(true);
      expect(result.reason).toBe('rate_limit');
      expect(result.response).toBeTruthy();
    });

    it('detects greeting intent', () => {
      const result = getFallbackResponse('مرحبا كيف حالك', 'error');
      expect(result.response).toBeTruthy();
    });

    it('detects shipment intent', () => {
      const result = getFallbackResponse('أين شحنتي', 'error');
      expect(result.response).toBeTruthy();
    });

    it('detects support intent', () => {
      const result = getFallbackResponse('أحتاج مساعدة', 'error');
      expect(result.response).toBeTruthy();
    });
  });

  describe('handleAIRequest', () => {
    it('returns result on success', async () => {
      const mockRequest = vi.fn().mockResolvedValue({ data: 'success' });
      
      const result = await handleAIRequest('test_user', mockRequest);
      
      expect(result).toEqual({ data: 'success' });
      expect(mockRequest).toHaveBeenCalled();
    });

    it('returns fallback on timeout', async () => {
      const mockRequest = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 5000))
      );
      
      const result = await handleAIRequest('test_user', mockRequest, {
        timeout: 100,
        message: 'test',
      });
      
      expect((result as any).isFallback).toBe(true);
      expect((result as any).reason).toBe('timeout');
    });

    it('returns fallback on error', async () => {
      const mockRequest = vi.fn().mockRejectedValue(new Error('API Error'));
      
      const result = await handleAIRequest('test_user', mockRequest, {
        message: 'test',
      });
      
      expect((result as any).isFallback).toBe(true);
      expect((result as any).reason).toBe('error');
    });

    it('calls onFallback callback', async () => {
      const mockRequest = vi.fn().mockRejectedValue(new Error('Error'));
      const onFallback = vi.fn();
      
      await handleAIRequest('test_user', mockRequest, {
        message: 'test',
        onFallback,
      });
      
      expect(onFallback).toHaveBeenCalled();
    });
  });
});
