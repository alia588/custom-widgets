#!/usr/bin/env node
import * as esbuild from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const watch = process.argv.includes('--watch');

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
  outfile: path.resolve(__dirname, '../public/widget.js'),
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
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log('[custom-widgets] Watching for widget changes...');
} else {
  await esbuild.build(buildOptions);
  console.log('[custom-widgets] Widget bundle written to public/widget.js');
}
