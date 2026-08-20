import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  async rewrites() {
    return [
      {
        // Embed snippets generated before the stable-URL fix reference
        // build-specific hashed bundles (widget.<hash>.js) that stop existing
        // after the next redeploy, 404ing every widget on that client site.
        // Rewrite any such request to the current bundle so old embed codes
        // keep working forever. Rewrites run after the filesystem check, so a
        // hashed file that does exist in public/ is still served directly.
        source: '/:bundle(widget\\.[a-f0-9]{16}\\.js)',
        destination: '/api/embeds/widget.js',
      },
    ];
  },
};

export default nextConfig;
