import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

// Serves the embed bundle at the same path shape the old DesignDetail snippet
// uses (https://app.designdetail.io/api/embeds/widget.js), so existing embed
// codes keep working when the domain is pointed at this app.
export async function GET() {
  const bundle = await readFile(path.join(process.cwd(), 'public', 'widget.js'));

  return new NextResponse(new Uint8Array(bundle), {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
