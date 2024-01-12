import path from 'path';

export type RobotsEntry = R<{
  path: Str;
  allow: Bool;
}>

export function buildRobotsTxt(sitemapUrl: Str, entries: RArr<RobotsEntry>): Str {
  return `User-agent: *\n${entries.map(entry => `${entry.allow ? 'Allow' : 'Disallow'}: ${path.posix.join('/', entry.path)}`).join('\n')}\n\nSitemap: ${sitemapUrl}\n`;
}

export function buildSitemapTxt(pageUrls: RArr<Str>): Str {
  return pageUrls.join('\n');
}