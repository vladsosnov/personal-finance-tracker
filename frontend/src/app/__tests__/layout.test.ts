import { metadata } from '../layout';

describe('app metadata', () => {
  it('uses the PWA logo for the favicon and apple touch icon', () => {
    expect(metadata.icons).toEqual({
      icon: '/icons/icon.svg',
      apple: '/icons/icon-192x192.png',
    });
  });
});
