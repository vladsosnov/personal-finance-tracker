import { hexToRgba } from '../color';

describe('hexToRgba', () => {
  it('converts 6-digit hex to rgba', () => {
    expect(hexToRgba('#ff0000', 1)).toBe('rgba(255, 0, 0, 1)');
    expect(hexToRgba('#00ff00', 0.5)).toBe('rgba(0, 255, 0, 0.5)');
    expect(hexToRgba('#0000ff', 0)).toBe('rgba(0, 0, 255, 0)');
  });

  it('converts 3-digit hex to rgba', () => {
    expect(hexToRgba('#f00', 1)).toBe('rgba(255, 0, 0, 1)');
    expect(hexToRgba('#0f0', 0.5)).toBe('rgba(0, 255, 0, 0.5)');
    expect(hexToRgba('#00f', 0)).toBe('rgba(0, 0, 255, 0)');
  });

  it('handles hex with hash prefix', () => {
    expect(hexToRgba('#123456', 0.8)).toBe('rgba(18, 52, 86, 0.8)');
  });

  it('handles hex without hash prefix', () => {
    expect(hexToRgba('123456', 0.8)).toBe('rgba(18, 52, 86, 0.8)');
  });

  it('handles different alpha values', () => {
    expect(hexToRgba('#ffffff', 0)).toBe('rgba(255, 255, 255, 0)');
    expect(hexToRgba('#ffffff', 0.25)).toBe('rgba(255, 255, 255, 0.25)');
    expect(hexToRgba('#ffffff', 0.5)).toBe('rgba(255, 255, 255, 0.5)');
    expect(hexToRgba('#ffffff', 0.75)).toBe('rgba(255, 255, 255, 0.75)');
    expect(hexToRgba('#ffffff', 1)).toBe('rgba(255, 255, 255, 1)');
  });

  it('handles lowercase hex', () => {
    expect(hexToRgba('#abcdef', 1)).toBe('rgba(171, 205, 239, 1)');
  });

  it('handles uppercase hex', () => {
    expect(hexToRgba('#ABCDEF', 1)).toBe('rgba(171, 205, 239, 1)');
  });
});
