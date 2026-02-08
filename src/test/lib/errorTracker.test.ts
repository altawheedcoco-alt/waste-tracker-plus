import { describe, it, expect, beforeEach, vi } from 'vitest';
import { errorTracker } from '@/lib/errorTracker';

// Mock Supabase
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

describe('ErrorTracker', () => {
  beforeEach(() => {
    errorTracker.clearAll();
  });

  it('tracks errors correctly', async () => {
    await errorTracker.track('Test error', 'medium', { component: 'Test' });
    
    const errors = errorTracker.getErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe('Test error');
    expect(errors[0].severity).toBe('medium');
  });

  it('categorizes network errors', async () => {
    await errorTracker.track('Network request failed', 'high');
    
    const errors = errorTracker.getErrors();
    expect(errors[0].category).toBe('network');
  });

  it('categorizes auth errors', async () => {
    await errorTracker.track('Unauthorized access 401', 'high');
    
    const errors = errorTracker.getErrors();
    expect(errors[0].category).toBe('auth');
  });

  it('categorizes AI errors', async () => {
    await errorTracker.track('AI rate limit exceeded 429', 'medium');
    
    const errors = errorTracker.getErrors();
    expect(errors[0].category).toBe('ai');
  });

  it('increments occurrences for duplicate errors', async () => {
    await errorTracker.track('Duplicate error');
    await errorTracker.track('Duplicate error');
    await errorTracker.track('Duplicate error');
    
    const errors = errorTracker.getErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].occurrences).toBe(3);
  });

  it('provides correct stats', async () => {
    await errorTracker.track('Network error', 'low');
    await errorTracker.track('Auth error 403', 'high');
    await errorTracker.track('Random error', 'critical');
    
    const stats = errorTracker.getStats();
    expect(stats.total).toBe(3);
    expect(stats.bySeverity.low).toBe(1);
    expect(stats.bySeverity.high).toBe(1);
    expect(stats.bySeverity.critical).toBe(1);
  });

  it('resolves errors', async () => {
    await errorTracker.track('Resolvable error');
    
    const errors = errorTracker.getErrors();
    const errorId = errors[0].id;
    
    errorTracker.resolve(errorId);
    
    const updated = errorTracker.getErrors();
    expect(updated[0].resolved).toBe(true);
  });
});
