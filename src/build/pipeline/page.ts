import { mapValues, toArr } from '@francescozoccheddu/ts-goodies/objects';
import { Body } from 'ambagi/pipeline/body';
import { PageConf } from 'ambagi/pipeline/conf';
import { BuildPageConf, BuildPageResult, emitData, emitFile, randomStaticName } from 'ambagi/pipeline/utils';
import { processBodyDef } from 'ambagi/tools/bodyDef';
import { parseBodyXml } from 'ambagi/tools/bodyXml';
import { makeXmlLoader, makeYamlLoader, XmlLoader, YamlLoader } from 'ambagi/tools/data';
import { buildFont } from 'ambagi/tools/fonts';
import { buildImage } from 'ambagi/tools/images';
import { makeLayoutBuilder } from 'ambagi/tools/layouts';
import { extractVideoThumbnail, getVideoInfo } from 'ambagi/tools/videos';
import { dirs } from 'ambagi/utils/dirs';
import path from 'path';

let pageConfLoader: YamlLoader<PageConf> | Nul = null;
let bodyLoader: XmlLoader<Body<true>> | Nul = null;

type FontResource = R<{
  woffUrl: Str;
  woff2Url: Str;
}>

export async function buildPage(dir: Str, buildConf: BuildPageConf): Promise<BuildPageResult> {
  pageConfLoader ??= makeYamlLoader<PageConf>(path.join(dirs.schemas, 'page.json'));
  bodyLoader ??= makeXmlLoader<Body<true>>(path.join(dirs.schemas, 'body.xsd'), parseBodyXml);
  const assetsDir = path.join(dir, 'assets');
  const pageConf = pageConfLoader(path.join(dir, 'page.yml'));
  const bodyDef = bodyLoader(path.join(dir, 'body.xml'));
  const maxImageSize = buildConf.siteConf.maxImageSize ?? { width: 2000, height: 2000 };
  const body = processBodyDef(bodyDef, {
    async processImage(def) {
      const file = path.join(assetsDir, def.sources.uri);
      const images = await buildImage(file, {
        maxWidth: maxImageSize.width,
        maxHeight: maxImageSize.height,
      });
      return {
        ...def,
        sources: images.map(img => ({
          uri: emitData(img.data),
          info: img.info,
        })),
      };
    },
    async processVideo(def) {
      const thumbnail = def.thumbnail ?? emitData(await extractVideoThumbnail(path.join(assetsDir, def.sources[0]!.uri)));
      return {
        ...def,
        thumbnail,
        sources: await Promise.all(def.sources.map(async src => {
          const file = path.join(assetsDir, src.uri);
          const info = await getVideoInfo(file);
          return {
            info,
            uri: emitFile(file),
          };
        })),
      };
    },
  });
  const fontUrls: RStrObj<FontResource> = mapValues(buildConf.fonts, () => ({
    woff2Url: randomStaticName(),
    woffUrl: randomStaticName(),
  }));
  const fontUsages = mapValues(buildConf.fonts, () => '');
  const html = makeLayoutBuilder(path.join(dirs.layouts, 'root.pug'))({
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
  });
  for (const [key, text] of toArr(fontUsages)) {
    const data = buildConf.fonts[key]!;
    const urls = fontUrls[key]!;
    const fonts = await buildFont(data, text);
    emitData(fonts.woff, urls.woffUrl);
    emitData(fonts.woff2, urls.woff2Url);
  }
  emitData(html, pageConf.url);
  return {
    allowRobots: pageConf.allowRobots ?? false,
    url: pageConf.url,
  };
}