const SENSITIVE_KEYS = new Set([
  'password',
  'pass',
  'pwd',
  'jwt',
  'token',
  'authorization',
  'cookie',
]);

export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);

  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k.toLowerCase())) out[k] = '[REDACTED]';
      else out[k] = redact(v);
    }
    return out;
  }

  return value;
}
