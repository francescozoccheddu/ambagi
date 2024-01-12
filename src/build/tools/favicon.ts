import { SiteConf } from 'ambagi/pipeline/conf';
import { dev } from 'ambagi/utils/env';
import fs from 'fs';
import path from 'path';

export type FaviconOutFile = R<{
  path: Str;
  data: Buffer | Str;
}>

export type FaviconOut = R<{
  files: RArr<FaviconOutFile>;
  htmlHeadElements: RArr<Str>;
}>

export async function buildFavicon(faviconFile: Str, siteConf: SiteConf, basePath: Str = '/'): Promise<FaviconOut> {
  const source = fs.readFileSync(faviconFile);
  const favicons = (await import('favicons')).default;
  const result = await favicons(source, {
    path: basePath,
    appName: siteConf.title,
    appShortName: siteConf.title,
    ...(siteConf.description ? { appDescription: siteConf.description } : {}),
    developerName: siteConf.author,
    developerURL: siteConf.url,
    lang: siteConf.language,
    icons: {
      android: false,
      appleIcon: false,
      appleStartup: false,
      favicons: !dev,
      windows: false,
      yandex: false,
    },
  });
  return {
    htmlHeadElements: result.html,
    files: [
      ...result.files.map(file => ({ data: file.contents, path: file.name })),
      ...result.images.map(file => ({ data: file.contents, path: file.name })),
    ].map(file => ({ ...file, path: path.join(basePath, file.path) })),
  };
}