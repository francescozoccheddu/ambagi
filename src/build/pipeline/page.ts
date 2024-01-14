import { mapValues, toArr } from '@francescozoccheddu/ts-goodies/objects';
import { Body, BodyImageSource } from 'ambagi/pipeline/body';
import { PageConf, SiteConfImageResolution } from 'ambagi/pipeline/conf';
import { BuildPageConf, BuildPageResult, emitData, emitFile, log, mimeToSuffix, popLog, pushLog, randomStaticName } from 'ambagi/pipeline/utils';
import { processBodyDef } from 'ambagi/tools/bodyDef';
import { parseBodyXml } from 'ambagi/tools/bodyXml';
import { buildCsp, cspValues } from 'ambagi/tools/csp';
import { makeXmlLoader, makeYamlLoader, XmlLoader, YamlLoader } from 'ambagi/tools/data';
import { buildFont } from 'ambagi/tools/fonts';
import { buildImage } from 'ambagi/tools/images';
import { makeLayoutBuilder } from 'ambagi/tools/layouts';
import { extractVideoThumbnail, getVideoInfo } from 'ambagi/tools/videos';
import { dirs } from 'ambagi/utils/dirs';
import { dev } from 'ambagi/utils/env';
import path from 'path';

let pageConfLoader: YamlLoader<PageConf> | Nul = null;
let bodyLoader: XmlLoader<Body<true>> | Nul = null;

type FontResource = R<{
  woffUrl: Str;
  woff2Url: Str;
}>

async function processImageSourceDef(imageFileOrData: Str | Buffer, maxSize: SiteConfImageResolution): Promise<RArr<BodyImageSource>> {
  const images = await buildImage(imageFileOrData, {
    maxWidth: maxSize.width,
    maxHeight: maxSize.height,
  });
  return images.map(img => ({
    uri: emitData(img.data, randomStaticName(mimeToSuffix(img.info.type))),
    info: img.info,
  }));
}

export async function buildPage(dir: Str, buildConf: BuildPageConf): Promise<BuildPageResult> {
  log('Load conf');
  pageConfLoader ??= makeYamlLoader<PageConf>(path.join(dirs.schemas, 'page.json'));
  bodyLoader ??= makeXmlLoader<Body<true>>(path.join(dirs.schemas, 'body.xsd'), parseBodyXml);
  const assetsDir = path.join(dir, 'assets');
  const pageConf = pageConfLoader(path.join(dir, 'page.yml'));
  const bodyDef = bodyLoader(path.join(dir, 'body.xml'));
  const maxImageSize = buildConf.siteConf.maxImageSize ?? { width: 2000, height: 2000 };
  pushLog('Process body');
  const body = await processBodyDef(bodyDef, {
    async processImage(def) {
      log(`Processing image '${def.sources.uri}'`);
      const file = path.join(assetsDir, def.sources.uri);
      return {
        ...def,
        sources: await processImageSourceDef(file, maxImageSize),
      };
    },
    async processVideo(def) {
      log(`Processing video '${def.sources[0]!.uri}'`);
      const sources = await Promise.all(def.sources.map(async src => {
        const file = path.join(assetsDir, src.uri);
        const info = await getVideoInfo(file);
        return {
          info,
          uri: emitFile(file, randomStaticName(mimeToSuffix(info.type))),
        };
      }));
      const rawThumbnail = def.thumbnails ?? await extractVideoThumbnail(path.join(assetsDir, def.sources[0]!.uri), def.thumbnailTime ?? 0);
      return {
        ...def,
        thumbnailTime: undefined,
        thumbnails: await processImageSourceDef(rawThumbnail, {
          width: Math.max(...sources.map(s => s.info.width)),
          height: Math.max(...sources.map(s => s.info.height)),
        }),
        sources,
      };
    },
  });
  popLog();
  const fontUrls: RStrObj<FontResource> = mapValues(buildConf.fonts, () => ({
    woff2Url: randomStaticName('.woff2'),
    woffUrl: randomStaticName('.woff'),
  }));
  const fontUsages = mapValues(buildConf.fonts, () => '');
  log('Build layout');
  const html = await makeLayoutBuilder(path.join(dirs.layouts, 'root.pug'))({
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
    pageConf: {
      allowRobots: pageConf.allowRobots ?? false,
      title: pageConf.title,
      description: pageConf.description ?? null,
      keywords: pageConf.keywords ?? [],
    },
    body,
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
  emitData(html, `${pageConf.url}.html`);
  log('Done');
  return {
    allowRobots: pageConf.allowRobots ?? false,
    url: pageConf.url,
  };
}