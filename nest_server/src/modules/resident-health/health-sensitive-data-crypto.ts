import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export interface EncryptedHealthData {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: string;
}

export interface HealthSensitiveDataCryptoPort {
  encrypt(plaintext: string): EncryptedHealthData;
  decrypt(payload: EncryptedHealthData): string;
}

export const HEALTH_SENSITIVE_DATA_CRYPTO_PORT = Symbol('HEALTH_SENSITIVE_DATA_CRYPTO_PORT');

export class AesGcmHealthSensitiveDataCryptoAdapter implements HealthSensitiveDataCryptoPort {
  constructor(
    private readonly key: Buffer,
    private readonly keyVersion: string,
  ) {
    if (key.length !== 32)
      throw new Error('HEALTH_DATA_ENCRYPTION_KEY must decode to exactly 32 bytes');
  }

  encrypt(plaintext: string): EncryptedHealthData {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    return {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64'),
      keyVersion: this.keyVersion,
    };
  }

  decrypt(payload: EncryptedHealthData): string {
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(payload.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }
}

/** Explicitly test-only deterministic adapter; it must never be registered in production. */
export class DeterministicTestHealthCryptoAdapter implements HealthSensitiveDataCryptoPort {
  encrypt(plaintext: string): EncryptedHealthData {
    return {
      ciphertext: Buffer.from(plaintext, 'utf8').toString('base64'),
      iv: 'test-only',
      authTag: 'test-only',
      keyVersion: 'test-only',
    };
  }
  decrypt(payload: EncryptedHealthData): string {
    return Buffer.from(payload.ciphertext, 'base64').toString('utf8');
  }
}
