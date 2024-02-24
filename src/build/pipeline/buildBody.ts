import { Body, BodyImageSource } from 'ambagi/pipeline/body';
import { BuildResourcesResult } from 'ambagi/pipeline/buildResources';
import { SiteConf, SiteConfImageResolution } from 'ambagi/pipeline/conf';
import { emitData, emitFile, log, mimeToSuffix, popLog, pushLog, randomStaticName, TextLocal } from 'ambagi/pipeline/utils';
import { processBodyDef } from 'ambagi/tools/bodyDef';
import { parseBodyXml } from 'ambagi/tools/bodyXml';
import { makeXmlLoader, XmlLoader } from 'ambagi/tools/data';
import { buildImage } from 'ambagi/tools/images';
import { LayoutBuilder, makeLayoutBuilder } from 'ambagi/tools/layouts';
import { extractVideoThumbnail, getVideoInfo } from 'ambagi/tools/videos';
import { dirs } from 'ambagi/utils/dirs';
import { dev } from 'ambagi/utils/env';
import path from 'path';

type LayoutLocals = R<{
  text: TextLocal;
  res: BuildResourcesResult;
  body: Body;
}>

let bodyLoader: XmlLoader<Body<true>> | Nul = null;
let layoutBuilder: LayoutBuilder<LayoutLocals> | Nul = null;

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

export type BuildPageBodyConf = R<{
  textLocal: TextLocal;
  resources: BuildResourcesResult;
  siteConf: SiteConf;
  dir: Str;
}>

export type BuildPageBodyResult = R<{
  html: Str;
}>

export async function buildPageBody(buildConf: BuildPageBodyConf): Promise<BuildPageBodyResult> {
  log('Load conf');
  if (dev) {
    layoutBuilder = null;
    bodyLoader = null;
  }
  layoutBuilder ??= makeLayoutBuilder<LayoutLocals>(path.join(dirs.layouts, 'body.pug'));
  bodyLoader ??= makeXmlLoader<Body<true>>(path.join(dirs.schemas, 'body.xsd'), parseBodyXml);
  const assetsDir = path.join(buildConf.dir, 'assets');
  const bodyDef = bodyLoader(path.join(buildConf.dir, 'body.xml'));
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
  log('Build layout');
  const html = await layoutBuilder({
    text: buildConf.textLocal,
    res: buildConf.resources,
    body,
  });
  log('Done');
  return {
    html,
  };
}