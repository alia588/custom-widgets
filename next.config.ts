import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  async headers() {
    return [
      {
        // The dashboard reads this to generate a cache-busted embed snippet.
        source: '/widget-manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
      {
        // Only the build script can emit this path shape. Its content hash
        // makes a one-year immutable cache safe, unlike legacy widget.js.
        source: '/:bundle(widget\\.[a-f0-9]{16}\\.js)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
