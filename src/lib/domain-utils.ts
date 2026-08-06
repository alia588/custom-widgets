import { supabase } from './db';

const ALLOWED_DOMAINS_CACHE_TTL_MS = 60_000;

let allowedDomainsCache: {
  domains: string[];
  expiresAt: number;
} | null = null;

export async function getAllowedDomains(): Promise<string[]> {
  const now = Date.now();
  if (allowedDomainsCache && allowedDomainsCache.expiresAt > now) {
    return allowedDomainsCache.domains;
  }

  const { data } = await supabase.from('allowed_domains').select('domain');
  const domains = (data ?? []).map((d) => d.domain);

  allowedDomainsCache = {
    domains,
    expiresAt: now + ALLOWED_DOMAINS_CACHE_TTL_MS,
  };

  return domains;
}

export function normalizeDomain(input: string): string {
  let trimmed = input.trim().toLowerCase();

  // Strip protocol prefixes.
  trimmed = trimmed.replace(/^(https?:\/\/)/, '');

  // Strip www prefix so users don't accidentally add it as a separate domain.
  trimmed = trimmed.replace(/^www\./, '');

  // Strip port, path, query, hash.
  const [host] = trimmed.split(/[/?#]/);
  return host.split(':')[0];
}

export function getRequestOrigin(request: Request): string | null {
  const origin = request.headers.get('origin');
  if (origin) return origin;

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      return null;
    }
  }

  return null;
}

export function isOriginAllowed(origin: string | null, allowedDomains: string[]): boolean {
  // Strict mode: an empty whitelist blocks everyone. The dashboard fetches
  // widget data server-side, so only cross-origin embed requests are affected.
  if (allowedDomains.length === 0) return false;
  if (!origin) return false;

  let hostname: string;
  try {
    hostname = new URL(origin).hostname;
  } catch {
    return false;
  }

  // Strip www. from the request hostname as well so both www.example.com
  // and example.com match an entry stored as example.com.
  const normalizedHostname = hostname.replace(/^www\./, '').toLowerCase();

  return allowedDomains.some((domain) => {
    const normalizedDomain = domain.trim().toLowerCase();
    if (!normalizedDomain) return false;

    // Exact hostname match.
    if (normalizedHostname === normalizedDomain) return true;

    // Wildcard subdomain match for entries like *.example.com.
    if (normalizedDomain.startsWith('*.')) {
      const suffix = normalizedDomain.slice(2);
      if (suffix && (normalizedHostname === suffix || normalizedHostname.endsWith('.' + suffix))) {
        return true;
      }
    }

    return false;
  });
}

export function getWidgetCorsHeaders(
  request: Request,
  allowedDomains: string[]
): { allowed: false; headers: Record<string, string> } | { allowed: true; headers: Record<string, string> } {
  const origin = getRequestOrigin(request);

  if (!isOriginAllowed(origin, allowedDomains)) {
    return {
      allowed: false,
      headers: { 'Content-Type': 'application/json' },
    };
  }

  return {
    allowed: true,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    },
  };
}
