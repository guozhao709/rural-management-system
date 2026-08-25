import { normalizeCropAlias } from './crop-normalization';
describe('normalizeCropAlias', () => {
  it('normalizes unicode, casing and whitespace', () =>
    expect(normalizeCropAlias('  WHEAT　 Crop  ')).toBe('wheat crop'));
  it('keeps chinese aliases stable', () => expect(normalizeCropAlias('  小 麦 ')).toBe('小 麦'));
});
