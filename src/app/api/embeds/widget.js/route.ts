import { readFile } from 'node:fs/promises';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { reportCritical } from '@/lib/alerts';

const WIDGET_JS_PATH = path.join(process.cwd(), 'public', 'widget.js');

// Cache the file content and ETag in memory so we don't re-read the disk on
// every request. The bundle only changes on deploy, so this is safe.
let cachedBundle: { content: Buffer; etag: string; mtimeMs: number } | null = null;

async function getBundle() {
  const stats = await stat(WIDGET_JS_PATH);

  if (cachedBundle && cachedBundle.mtimeMs === stats.mtimeMs) {
    return cachedBundle;
  }

  const content = await readFile(WIDGET_JS_PATH);
  const etag = `"${createHash('sha256').update(content).digest('hex').slice(0, 16)}"`;
  cachedBundle = { content, etag, mtimeMs: stats.mtimeMs };
  return cachedBundle;
}

// Serves the embed bundle at the same path shape the legacy snippet used
// (https://app.designdetail.io/api/embeds/widget.js), so embed codes pasted
// before this app existed keep working when the domain is pointed at it.
export async function GET(request: Request) {
  try {
    const { content, etag } = await getBundle();

    // Return 304 Not Modified if the client already has this version.
    if (request.headers.get('if-none-match') === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=31536000, immutable',
          ETag: etag,
        },
      });
    }

    return new NextResponse(new Uint8Array(content), {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': String(content.length),
        ETag: etag,
      },
    });
  } catch (err) {
    await reportCritical({
      title: 'Embed bundle unavailable',
      message: err instanceof Error ? err.message : 'Failed to serve widget.js',
      fingerprint: 'embed-bundle-unavailable',
      meta: { path: WIDGET_JS_PATH },
    });
    return NextResponse.json({ error: 'Embed bundle unavailable' }, { status: 500 });
  }
}
