import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The workspace package, imported by name the way any consumer would. It
  // resolves to its built `dist` through `main` and `exports`, the same files
  // npm ships; `publishConfig` swaps nothing (see CLAUDE.md).
  transpilePackages: ['remark-scanned-page'],

  /*
    On every response.

    - Nothing here can be framed. The desk has a delete button, and a page
      that fits in someone else's iframe can have that button clicked through
      a decoy laid over it.
    - `nosniff`, so a photograph served through a route is only ever an image.
    - Only the origin leaves as a referrer. A letter's address carries its
      title, and a link inside a letter should not hand that to wherever it
      points.
  */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
