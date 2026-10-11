import { describe, expect, it, vi } from 'vitest';
import { getArAvailability } from '../src/ar-session';

describe('AR support detection', () => {
  it('reports unavailable when WebXR is absent', async () => {
    Object.defineProperty(navigator, 'xr', { configurable: true, value: undefined });
    await expect(getArAvailability()).resolves.toBe('unavailable');
  });

  it('uses immersive-ar support checks when WebXR is present', async () => {
    const isSessionSupported = vi.fn().mockResolvedValue(true);
    Object.defineProperty(navigator, 'xr', { configurable: true, value: { isSessionSupported } });
    await expect(getArAvailability()).resolves.toBe('available');
    expect(isSessionSupported).toHaveBeenCalledWith('immersive-ar');
  });
});