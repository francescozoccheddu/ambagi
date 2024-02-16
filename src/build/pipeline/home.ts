import { mapValues, toArr } from '@francescozoccheddu/ts-goodies/objects';
import { BuildHomeConf, emitData, log, randomStaticName } from 'ambagi/pipeline/utils';
import { buildCsp, cspValues } from 'ambagi/tools/csp';
import { buildFont } from 'ambagi/tools/fonts';
import { makeLayoutBuilder } from 'ambagi/tools/layouts';
import { dirs } from 'ambagi/utils/dirs';
import { dev } from 'ambagi/utils/env';
import path from 'path';

type FontResource = R<{
  woffUrl: Str;
  woff2Url: Str;
}>

export async function buildHome(buildConf: BuildHomeConf): Promise<void> {
  const fontUrls: RStrObj<FontResource> = mapValues(buildConf.fonts, () => ({
    woff2Url: randomStaticName('.woff2'),
    woffUrl: randomStaticName('.woff'),
  }));
  const fontUsages = mapValues(buildConf.fonts, () => '');
  log('Build layout');
  const html = await makeLayoutBuilder(path.join(dirs.layouts, 'home.pug'))({
    res: {
      fonts: fontUrls,
      icons: buildConf.icons,
      scripts: buildConf.scripts,
      styles: buildConf.styles,
    },
    faviconHtml: buildConf.faviconHtml,
    text: (key: Str, text: Str): Str => {
      fontUsages[key] += text;
      return text;
    },
    siteConf: {
      allowRobots: buildConf.siteConf.allowRobots ?? false,
      title: buildConf.siteConf.title,
      description: buildConf.siteConf.description ?? null,
      keywords: buildConf.siteConf.keywords ?? [],
      language: buildConf.siteConf.language,
      author: buildConf.siteConf.author,
    },
    pages: buildConf.pages,
    csp: buildCsp(
      [
        { target: 'default-src', values: [cspValues.none] },
        { target: 'script-src', values: [cspValues.self, cspValues.unsafeInline] },
        { target: 'style-src', values: [cspValues.self, cspValues.unsafeInline] },
        { target: 'font-src', values: [cspValues.self] },
        { target: 'img-src', values: [cspValues.self] },
        { target: 'media-src', values: [cspValues.self] },
        ...(dev ? [{ target: 'connect-src', values: [cspValues.all] }] : []),
      ]),
  });
  log('Build fonts');
  for (const [key, text] of toArr(fontUsages)) {
    const data = buildConf.fonts[key]!;
    const urls = fontUrls[key]!;
    const fonts = await buildFont(data, text);
    emitData(fonts.woff, urls.woffUrl);
    emitData(fonts.woff2, urls.woff2Url);
  }
  emitData(html, 'index.html');
  log('Done');
}