import { isStr } from '@francescozoccheddu/ts-goodies/types';
import { BodyImageSourceInfo } from 'ambagi/pipeline/body';
import fs from 'fs';
import sharp, { Sharp } from 'sharp';

export type ImageOut = R<{
  data: Buffer;
  info: BodyImageSourceInfo;
}>

export type ImageOptions = R<{
  maxWidth: Num;
  maxHeight: Num;
}>

export async function buildImage(imageFileOrData: Str | Buffer, options: ImageOptions = { maxWidth: 2000, maxHeight: 2000 }, dev: Bool = false): Promise<RArr<ImageOut>> {
  const source = isStr(imageFileOrData) ? fs.readFileSync(imageFileOrData) : imageFileOrData;
  const img = sharp(source)
    .resize({
      width: options.maxWidth,
      height: options.maxHeight,
      fit: 'inside',
    })
    .removeAlpha();
  const candidates: RArr<Sharp> = [
    img.clone().webp({
      quality: 70,
      effort: dev ? 1 : 6,
    }),
    ...(dev ? [] : [
      img.clone().png({
        quality: 70,
        effort: 10,
        compressionLevel: dev ? 2 : 9,
      }),
      img.jpeg({
        quality: 70,
      }),
    ]),
  ];
  const images: Arr<ImageOut> = await Promise.all(candidates.map(async img => {
    const { data, info } = await img.toBuffer({ resolveWithObject: true });
    return {
      data,
      info: {
        width: info.width,
        height: info.height,
        type: info.format,
        size: info.size,
      },
    };
  }));
  return images.sort((a, b) => a.info.size - b.info.size).slice(0, 2);
}