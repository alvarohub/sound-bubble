import { describe, expect, it } from 'vitest';
import { bubbleScale, clampLevel, RESTING_RADIUS_METERS } from '../src/bubble';

describe('bubble visual math', () => {
  it('clamps externally supplied audio levels', () => {
    expect(clampLevel(-2)).toBe(0);
    expect(clampLevel(2)).toBe(1);
  });

  it('keeps scale bounded at the intended maximum response', () => {
    const scale = bubbleScale(1, 0);
    expect(scale.x).toBeLessThanOrEqual(1.8);
    expect(scale.y).toBeGreaterThan(0.8);
    expect(RESTING_RADIUS_METERS).toBe(0.075);
  });
});