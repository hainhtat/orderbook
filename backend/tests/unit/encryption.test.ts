import { decryptSecret, encryptSecret } from '../../src/utilities/encryption.js';

describe('secret encryption', () => {
  it('round trips without exposing plaintext and uses a fresh nonce', () => {
    const secret = 'test-encryption-key-that-is-long-enough';
    const first = encryptSecret('sk-private-value', secret);
    const second = encryptSecret('sk-private-value', secret);
    expect(first).not.toContain('sk-private-value');
    expect(first).not.toBe(second);
    expect(decryptSecret(first, secret)).toBe('sk-private-value');
  });

  it('rejects decryption with another key', () => {
    const encrypted = encryptSecret('sk-private-value', 'first-test-encryption-key-value');
    expect(() => decryptSecret(encrypted, 'second-test-encryption-key-value')).toThrow();
  });
});
