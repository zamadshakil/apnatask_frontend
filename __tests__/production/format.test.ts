import { formatPkr, normalizePakistanPhone } from '../../src/utils/format';

describe('Pakistan formatting and input rules', () => {
  it('normalizes local and international mobile numbers', () => {
    expect(normalizePakistanPhone('0300 1234567')).toBe('+923001234567');
    expect(normalizePakistanPhone('+92 300 1234567')).toBe('+923001234567');
  });

  it('rejects non-Pakistani or malformed mobile numbers', () => {
    expect(() => normalizePakistanPhone('12345')).toThrow('valid Pakistani');
  });

  it('stores paisa but displays whole PKR', () => {
    expect(formatPkr(250_000)).toContain('2,500');
    expect(formatPkr(null)).toBe('Price open');
  });
});
