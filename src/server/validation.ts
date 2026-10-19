/**
 * URL and Java Package validation and sanitization logic
 * Enforces strict SSRF protection and Android/Java package compliance.
 */

// List of Java reserved keywords that cannot be used as package segments
const JAVA_RESERVED_KEYWORDS = new Set([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char',
  'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum',
  'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements',
  'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'package',
  'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp',
  'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient',
  'try', 'void', 'volatile', 'while', 'true', 'false', 'null'
]);

/**
 * Checks if an IP or hostname is private or loopback (SSRF protection)
 */
export function isPrivateOrLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase().trim();

  // Direct names
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return true;
  }

  // IPv4 Private / Loopback / Link-Local ranges
  // 127.0.0.0/8
  // 10.0.0.0/8
  // 172.16.0.0/12 (172.16 - 172.31)
  // 192.168.0.0/16
  // 169.254.0.0/16 (Link-local, AWS/GCP metadata)
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = host.match(ipv4Regex);
  if (match) {
    const octet1 = parseInt(match[1], 10);
    const octet2 = parseInt(match[2], 10);
    const octet3 = parseInt(match[3], 10);
    const octet4 = parseInt(match[4], 10);

    if (octet1 > 255 || octet2 > 255 || octet3 > 255 || octet4 > 255) {
      return true;
    }

    if (octet1 === 127) return true;
    if (octet1 === 10) return true;
    if (octet1 === 0) return true;
    if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return true;
    if (octet1 === 192 && octet2 === 168) return true;
    if (octet1 === 169 && octet2 === 254) return true; // cloud metadata
  }

  return false;
}

/**
 * Validates and normalizes target website URL
 */
export function validateUrl(rawUrl: string): { valid: boolean; normalized?: string; error?: string; isHttp?: boolean } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'Website URL is required.' };
  }

  let trimmed = rawUrl.trim();

  // Block dangerous schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('file:') ||
    lower.startsWith('blob:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('about:')
  ) {
    return { valid: false, error: 'Disallowed URL protocol. Only HTTPS (and HTTP if allowed) are supported.' };
  }

  // Prepend https:// if protocol omitted
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { valid: false, error: 'Only HTTP or HTTPS protocols are supported.' };
    }

    if (!parsed.hostname || parsed.hostname.length < 3 || !parsed.hostname.includes('.')) {
      if (parsed.hostname !== 'localhost') {
        return { valid: false, error: 'Invalid hostname format. Please enter a valid domain (e.g. example.com).' };
      }
    }

    if (isPrivateOrLoopbackHost(parsed.hostname)) {
      return { valid: false, error: 'Access to localhost, internal networks, or cloud metadata IP addresses is blocked for security.' };
    }

    return {
      valid: true,
      normalized: parsed.href,
      isHttp: parsed.protocol === 'http:'
    };
  } catch {
    return { valid: false, error: 'Malformed URL. Please check spelling.' };
  }
}

/**
 * Suggests an Android package name from a domain name.
 * Example: "shop.example.com" -> "com.example.shop"
 * Example: "my-brand.co.uk" -> "uk.co.mybrand.app"
 */
export function suggestPackageName(domainOrUrl: string): string {
  try {
    let hostname = domainOrUrl.trim().toLowerCase();
    if (hostname.includes('://')) {
      hostname = new URL(hostname).hostname;
    }

    // Strip port if present
    hostname = hostname.split(':')[0];

    // Remove leading www.
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }

    const rawParts = hostname.split('.').filter(Boolean);
    if (rawParts.length === 0) {
      return 'com.mywebsite.app';
    }

    // Sanitize each part: keep only letters, numbers, underscores; strip hyphens
    const cleanParts = rawParts.map(part => {
      let sanitized = part.replace(/[^a-z0-9_]/g, '');
      if (!sanitized) sanitized = 'site';
      if (/^[0-9]/.test(sanitized)) sanitized = `app_${sanitized}`;
      if (JAVA_RESERVED_KEYWORDS.has(sanitized)) sanitized = `${sanitized}app`;
      return sanitized;
    });

    if (cleanParts.length === 1) {
      return `com.${cleanParts[0]}.app`;
    }

    // Reverse domain notation: e.g. ["example", "com"] -> "com.example"
    const reversed = [...cleanParts].reverse();
    // If top-level is like "com", "org", "net", "io", "app"
    let packageName = reversed.join('.');

    // If only two segments (e.g. com.example), append .app for standard 3-segment convention
    if (reversed.length === 2) {
      packageName = `${packageName}.app`;
    }

    // Ensure it passes validation; if not, fallback
    const validation = validatePackageName(packageName);
    if (validation.valid) {
      return packageName;
    }
    return 'com.mywebsite.app';
  } catch {
    return 'com.mywebsite.app';
  }
}

/**
 * Suggests a friendly human-readable App Name from URL
 */
export function suggestAppName(domainOrUrl: string): string {
  try {
    let hostname = domainOrUrl.trim();
    if (hostname.includes('://')) {
      hostname = new URL(hostname).hostname;
    }
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }
    const mainPart = hostname.split('.')[0];
    if (!mainPart) return 'My App';

    // Capitalize and replace hyphens/underscores with spaces
    const words = mainPart.split(/[-_]/).filter(Boolean);
    const capitalized = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return capitalized || 'My App';
  } catch {
    return 'My App';
  }
}

/**
 * Validates whether a package name conforms strictly to Java identifier & Android rules.
 * Requirements:
 * - Must have at least 2 segments separated by dots.
 * - Each segment must begin with a letter (a-z, A-Z) or underscore.
 * - Each segment can only contain alphanumeric characters or underscore (NO HYPHENS).
 * - No segment can be a Java keyword.
 * - Entire package name length <= 255 chars.
 */
export function validatePackageName(pkg: string): { valid: boolean; error?: string } {
  if (!pkg || typeof pkg !== 'string') {
    return { valid: false, error: 'Package name is required.' };
  }

  const trimmed = pkg.trim();
  if (trimmed.length > 255) {
    return { valid: false, error: 'Package name must be 255 characters or fewer.' };
  }

  if (trimmed.includes('-')) {
    return { valid: false, error: 'Package name cannot contain hyphens (-). Use underscores or remove them.' };
  }

  const segments = trimmed.split('.');
  if (segments.length < 2) {
    return { valid: false, error: 'Package name must contain at least two segments (e.g., com.example.app).' };
  }

  const segmentRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    if (!segment) {
      return { valid: false, error: 'Package name contains empty segments (e.g., double dots "..").' };
    }

    if (!segmentRegex.test(segment)) {
      return {
        valid: false,
        error: `Segment "${segment}" is invalid. Each segment must start with a letter or underscore and contain only letters, numbers, and underscores.`
      };
    }

    if (JAVA_RESERVED_KEYWORDS.has(segment.toLowerCase())) {
      return {
        valid: false,
        error: `"${segment}" is a Java reserved keyword and cannot be used in an Android package name.`
      };
    }
  }

  return { valid: true };
}
