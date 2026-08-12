import { readFile } from 'node:fs/promises';
import path from 'node:path';

const MANIFEST_PATH = path.join(process.cwd(), 'public', 'widget-manifest.json');
const HASHED_BUNDLE_RE = /^widget\.[a-f0-9]{16}\.js$/;

/**
 * Returns the content-addressed embed asset produced by build-widget. The
 * fallback keeps local development and older deploy artifacts functional.
 */
export async function getEmbedBundlePath(): Promise<string> {
  try {
    const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8')) as {
      file?: unknown;
    };
    if (typeof manifest.file === 'string' && HASHED_BUNDLE_RE.test(manifest.file)) {
      return `/${manifest.file}`;
    }
  } catch {
    // The dev watcher may not have produced its first bundle yet.
  }

  return '/api/embeds/widget.js';
}
