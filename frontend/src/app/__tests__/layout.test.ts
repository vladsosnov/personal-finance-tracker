import { metadata } from '../layout';

describe('app metadata', () => {
  it('uses the PWA logo for the favicon and apple touch icon', () => {
    expect(metadata.icons).toEqual({
      icon: [
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/icons/icon.svg', type: 'image/svg+xml' },
      ],
      apple: '/icons/icon-192x192.png',
    });
  });
});
