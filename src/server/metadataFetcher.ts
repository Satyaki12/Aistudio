import { validateUrl, suggestPackageName, suggestAppName } from './validation.ts';
import type { UrlValidationResult } from './types.ts';

/**
 * Safely fetches target website headers and metadata without logging full HTML
 */
export async function fetchWebsiteMetadata(targetUrl: string): Promise<UrlValidationResult> {
  const validation = validateUrl(targetUrl);
  if (!validation.valid || !validation.normalized) {
    return {
      valid: false,
      error: validation.error || 'Invalid URL.',
      hasSsl: false
    };
  }

  const urlObj = new URL(validation.normalized);
  const domain = urlObj.hostname;
  const isHttps = urlObj.protocol === 'https:';

  const defaultSuggestedName = suggestAppName(domain);
  const defaultSuggestedPackage = suggestPackageName(domain);

  // Default fallback icons based on domain
  const fallbackFavicon = `${urlObj.origin}/favicon.ico`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(validation.normalized, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36 URL2APK-Scanner/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      redirect: 'follow'
    });

    clearTimeout(timeout);

    // Read headers for iframe/security policy insights
    const xfo = response.headers.get('x-frame-options') || '';
    const csp = response.headers.get('content-security-policy') || '';

    const hasXFrameOptions = Boolean(xfo);
    const hasCsp = csp.includes('frame-ancestors');

    let frameNote = 'Compatible with native Android WebView.';
    if (hasXFrameOptions || hasCsp) {
      frameNote = 'Site sends X-Frame-Options / frame-ancestors. While web iframes may be blocked from embedding, Android WebView runs in a dedicated top-level application container and will load normally.';
    }

    // Limit HTML read to first 120KB to extract head tags quickly and prevent memory exhaustion
    const reader = response.body?.getReader();
    let htmlSnippet = '';
    if (reader) {
      const decoder = new TextDecoder();
      let bytesRead = 0;
      const maxBytes = 120 * 1024; // 120 KB

      while (bytesRead < maxBytes) {
        const { done, value } = await reader.read();
        if (done || !value) break;
        bytesRead += value.length;
        htmlSnippet += decoder.decode(value, { stream: true });
        if (htmlSnippet.includes('</head>')) {
          break;
        }
      }
      reader.cancel();
    }

    // Parse metadata using regex (safe on first 120kb head snippet)
    let pageTitle = '';
    const titleMatch = htmlSnippet.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      pageTitle = titleMatch[1].trim();
    }

    // OpenGraph title fallback
    const ogTitleMatch = htmlSnippet.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
                         htmlSnippet.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
    if (!pageTitle && ogTitleMatch && ogTitleMatch[1]) {
      pageTitle = ogTitleMatch[1].trim();
    }

    // Apple Touch Icon
    let appleTouchIconUrl = '';
    const appleTouchMatch = htmlSnippet.match(/<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i) ||
                           htmlSnippet.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon["']/i);
    if (appleTouchMatch && appleTouchMatch[1]) {
      appleTouchIconUrl = resolveUrl(appleTouchMatch[1], validation.normalized);
    }

    // Favicon link
    let faviconUrl = '';
    const faviconMatch = htmlSnippet.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i) ||
                         htmlSnippet.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i);
    if (faviconMatch && faviconMatch[1]) {
      faviconUrl = resolveUrl(faviconMatch[1], validation.normalized);
    } else {
      faviconUrl = fallbackFavicon;
    }

    // Theme color
    let themeColor = '';
    const themeMatch = htmlSnippet.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i) ||
                       htmlSnippet.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']theme-color["']/i);
    if (themeMatch && themeMatch[1]) {
      themeColor = themeMatch[1].trim();
    }

    // Manifest link (PWA)
    const hasManifest = /<link[^>]+rel=["']manifest["']/i.test(htmlSnippet);

    // Clean up title to app name candidate (e.g., "Google Store - Pixel & Nest" -> "Google Store")
    let suggestedName = defaultSuggestedName;
    if (pageTitle) {
      const parts = pageTitle.split(/[|\-–•]/);
      const cleanCandidate = (parts[0] || '').trim();
      if (cleanCandidate.length >= 2 && cleanCandidate.length <= 30) {
        suggestedName = cleanCandidate;
      }
    }

    return {
      valid: true,
      normalizedUrl: validation.normalized,
      domain,
      suggestedAppName: suggestedName,
      suggestedPackageName: defaultSuggestedPackage,
      faviconUrl: appleTouchIconUrl || faviconUrl,
      appleTouchIconUrl,
      themeColor: themeColor || '#1e293b',
      hasSsl: isHttps,
      warning: !isHttps ? 'Website uses unencrypted HTTP. Android requires explicit cleartext opt-in.' : undefined,
      frameRestrictions: {
        hasXFrameOptions,
        hasCsp,
        note: frameNote
      },
      pwaReady: hasManifest
    };
  } catch (err: any) {
    // If fetch failed (e.g. offline, DNS failure, timeout), still provide domain-based defaults
    return {
      valid: true,
      normalizedUrl: validation.normalized,
      domain,
      suggestedAppName: defaultSuggestedName,
      suggestedPackageName: defaultSuggestedPackage,
      faviconUrl: fallbackFavicon,
      hasSsl: isHttps,
      warning: `Live site check notice: ${err.message || 'Could not reach server during pre-check, but project can still be generated.'}`,
      frameRestrictions: {
        hasXFrameOptions: false,
        hasCsp: false,
        note: 'Default WebView container configuration applied.'
      }
    };
  }
}

function resolveUrl(href: string, base: string): string {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}
