import { toObj } from '@francescozoccheddu/ts-goodies/arrays';
import { isStr } from '@francescozoccheddu/ts-goodies/types';
import fs from 'fs';
import subsetFont from 'subset-font';

export type FontOut = R<{
  woff: Buffer;
  woff2: Buffer;
}>

export async function buildFont(fontFileOrData: Str | Buffer, alphabet: Str): Promise<FontOut> {
  const source = isStr(fontFileOrData) ? fs.readFileSync(fontFileOrData) : fontFileOrData;
  const formats = ['woff2', 'woff'] as const;
  return toObj(await Promise.all(formats.map(async format => [
    format,
    await subsetFont(source, alphabet, { targetFormat: format }),
  ])));
}
