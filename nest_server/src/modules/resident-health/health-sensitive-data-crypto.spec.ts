import { randomBytes } from 'node:crypto';
import { AesGcmHealthSensitiveDataCryptoAdapter } from './health-sensitive-data-crypto';

describe('AesGcmHealthSensitiveDataCryptoAdapter', () => {
  const key = randomBytes(32);
  it('encrypts with random nonces and authenticates plaintext', () => {
    const adapter = new AesGcmHealthSensitiveDataCryptoAdapter(key, 'v1');
    const first = adapter.encrypt('敏感健康资料');
    const second = adapter.encrypt('敏感健康资料');
    expect(first.ciphertext).not.toBe('敏感健康资料');
    expect(first.iv).not.toBe(second.iv);
    expect(adapter.decrypt(first)).toBe('敏感健康资料');
  });

  it('rejects tampered ciphertext and wrong keys', () => {
    const adapter = new AesGcmHealthSensitiveDataCryptoAdapter(key, 'v1');
    const encrypted = adapter.encrypt('secret');
    expect(() =>
      adapter.decrypt({ ...encrypted, ciphertext: Buffer.from('tampered').toString('base64') }),
    ).toThrow();
    expect(() =>
      new AesGcmHealthSensitiveDataCryptoAdapter(randomBytes(32), 'v2').decrypt(encrypted),
    ).toThrow();
  });
});
