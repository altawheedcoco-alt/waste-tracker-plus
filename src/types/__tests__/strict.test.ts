import { describe, it, expect } from 'vitest';
import { safeJsonParse, isNotNull, extractRows } from '@/types/strict';

describe('strict type utilities', () => {
  it('safeJsonParse returns parsed value', () => {
    expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 });
  });

  it('safeJsonParse returns fallback on invalid JSON', () => {
    expect(safeJsonParse('invalid', { fallback: true })).toEqual({ fallback: true });
  });

  it('safeJsonParse returns fallback on null', () => {
    expect(safeJsonParse(null, [])).toEqual([]);
  });

  it('isNotNull filters correctly', () => {
    expect(isNotNull(0)).toBe(true);
    expect(isNotNull('')).toBe(true);
    expect(isNotNull(null)).toBe(false);
    expect(isNotNull(undefined)).toBe(false);
  });

  it('extractRows returns empty array on error', () => {
    expect(extractRows({ data: null, error: 'fail' } as any)).toEqual([]);
  });

  it('extractRows returns data on success', () => {
    const rows = [{ id: '1' }] as any;
    expect(extractRows({ data: rows, error: null } as any)).toEqual(rows);
  });
});
