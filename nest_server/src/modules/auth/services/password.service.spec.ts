import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes and verifies passwords with Argon2id', async () => {
    const hash = await service.hash('example-password');

    expect(hash.startsWith('$argon2id$')).toBe(true);
    await expect(service.verify(hash, 'example-password')).resolves.toBe(true);
    await expect(service.verify(hash, 'wrong-password')).resolves.toBe(false);
  });
});
