import { describe, it, expect } from '@jest/globals';

function slugifyLocal(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

describe('slugify', () => {
  it('normalizes shop names', () => {
    expect(slugifyLocal('Glow Beauty Shop')).toBe('glow-beauty-shop');
  });
});
