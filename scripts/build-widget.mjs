#!/usr/bin/env node
import * as esbuild from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const watch = process.argv.includes('--watch');
const publicDir = path.resolve(__dirname, '../public');
const bundlePath = path.join(publicDir, 'widget.js');

async function publishHashedBundle() {
  const content = await fs.readFile(bundlePath);
  const hash = createHash('sha256').update(content).digest('hex').slice(0, 16);
  const file = `widget.${hash}.js`;

  await Promise.all([
    fs.writeFile(path.join(publicDir, file), content),
    fs.writeFile(path.join(publicDir, 'widget-manifest.json'), `${JSON.stringify({ file })}\n`),
  ]);
  console.log(`[custom-widgets] Published immutable ${file}`);
}

/**
 * Loads `.css?inline` imports as plain strings so the embed script can inject
 * styles into each Shadow DOM instance.
 */
const cssInlinePlugin = {
  name: 'css-inline',
  setup(build) {
    build.onResolve({ filter: /\.css\?inline$/ }, (args) => {
      const resolved = path.resolve(
        args.importer ? path.dirname(args.importer) : process.cwd(),
        args.path.replace(/\?inline$/, '')
      );
      return { path: resolved, namespace: 'css-inline' };
    });

    build.onLoad({ filter: /.*/, namespace: 'css-inline' }, async (args) => {
      const contents = await fs.readFile(args.path, 'utf8');
      return { contents, loader: 'text' };
    });
  },
};

const buildOptions = {
  entryPoints: [path.resolve(__dirname, '../src/embed.tsx')],
  bundle: true,
  outfile: bundlePath,
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  jsx: 'automatic',
  jsxImportSource: 'preact',
  minify: !watch,
  plugins: [cssInlinePlugin],
  logLevel: 'info',
  alias: {
    react: 'preact/compat',
    'react-dom': 'preact/compat',
    'react/jsx-runtime': 'preact/jsx-runtime',
    'react/jsx-dev-runtime': 'preact/jsx-dev-runtime',
  },
};

if (watch) {
  buildOptions.plugins.push({
    name: 'publish-hashed-widget',
    setup(build) {
      build.onEnd(async (result) => {
        if (result.errors.length === 0) await publishHashedBundle();
      });
    },
  });
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log('[custom-widgets] Watching for widget changes...');
} else {
  await esbuild.build(buildOptions);
  await publishHashedBundle();
  console.log('[custom-widgets] Widget bundle written to public/widget.js');
}
