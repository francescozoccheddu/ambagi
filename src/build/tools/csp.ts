
export type CSPolicy = R<{
  target: Str;
  values: RArr<Str>;
}>

export const cspValues = {
  none: '\'none\'',
  self: '\'self\'',
  unsafeInline: '\'unsafe-inline\'',
  unsafeEval: '\'unsafe-eval\'',
  strictDynamic: '\'strict-dynamic\'',
  unsafeHashes: '\'unsafe-hashes\'',
  data: 'data:',
  all: '*',
  url(url: Str) { return url; },
  nonce(nonce: Str) { return `'nonce-${nonce}'`; },
  sha256(hash: Str) { return `'sha256-${hash}'`; },
  sha384(hash: Str) { return `'sha384-${hash}'`; },
  sha512(hash: Str) { return `'sha512-${hash}'`; },
} as const;

export function buildCsp(policies: RArr<CSPolicy>): Str {
  return policies.map(p => `${p.target} ${p.values.join(' ')}`).join(';');
}