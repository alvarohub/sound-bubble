import { describe, expect, it } from 'vitest';
import { rms, smoothLevel } from '../src/audio-input';

describe('audio level analysis', () => {
  it('calculates RMS from samples', () => {
    expect(rms(new Float32Array([1, -1, 1, -1]))).toBe(1);
    expect(rms(new Float32Array())).toBe(0);
  });

  it('attacks faster than it releases', () => {
    const attack = smoothLevel(0, 1, 0.05);
    const release = smoothLevel(1, 0, 0.05);
    expect(attack).toBeGreaterThan(1 - release);
  });
});