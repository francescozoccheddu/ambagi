import { Body, BodyElement, BodyElementKind, BodyFootnoteChild, BodyFootnotes, BodyImage, BodyMedia, BodyVideo } from 'ambagi/pipeline/body';

export type BodyDefProcessor = R<{
  processVideo(def: BodyVideo<true>): BodyVideo | Promise<BodyVideo>;
  processImage(def: BodyImage<true>): BodyImage | Promise<BodyImage>;
}>

async function processMedia(mediaDef: BodyMedia<true>, processor: BodyDefProcessor): Promise<BodyMedia> {
  switch (mediaDef.kind) {
    case BodyElementKind.video:
      return await processor.processVideo(mediaDef);
    case BodyElementKind.image:
      return await processor.processImage(mediaDef);
  }
}

async function processElement(elementDef: BodyElement<true>, processor: BodyDefProcessor): Promise<BodyElement> {
  if (elementDef.kind === BodyElementKind.video || elementDef.kind === BodyElementKind.image) {
    return await processMedia(elementDef, processor);
  }
  if (elementDef.kind === BodyElementKind.mediaBox) {
    return {
      ...elementDef,
      child: await processMedia(elementDef.child, processor),
    };
  }
  return elementDef;
}

async function processFootnotes(footnotesDef: BodyFootnotes<true>, processor: BodyDefProcessor): Promise<BodyFootnotes> {
  return await Promise.all(footnotesDef.map(async fn => ({
    ...fn,
    child: await processElement(fn.child, processor) as BodyFootnoteChild,
  })));
}

async function processMain(mainDef: RArr<BodyElement<true>>, processor: BodyDefProcessor): Promise<RArr<BodyElement>> {
  return await Promise.all(mainDef.map(async el => await processElement(el, processor)));
}

export async function processBodyDef(bodyDef: Body<true>, processor: BodyDefProcessor): Promise<Body> {
  return {
    ...bodyDef,
    footnotes: await processFootnotes(bodyDef.footnotes, processor),
    main: await processMain(bodyDef.main, processor),
  };
}

export enum BodyAssetSourceKind {
  file, url
}

export type BodyAssetSource = R<{
  kind: BodyAssetSourceKind;
  uri: Str;
}>