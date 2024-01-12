import { joinUrl } from 'ambagi/utils/urls';

export type RobotsEntry = R<{
  path: Str;
  allow: Bool;
}>

export function buildRobotsTxt(baseUrl: Str, entries: RArr<RobotsEntry>): Str {
  return `User-agent: *\n${entries.map(entry => `${entry.allow ? 'Allow' : 'Disallow'}: ${joinUrl(baseUrl, entry.path)}`).join('\n')}`;
}

export function buildSitemapTxt(baseUrl: Str, pagesUrlPath: RArr<Str>): Str {
  return pagesUrlPath.map(pageUrl => joinUrl(baseUrl, pageUrl)).join('\n');
}