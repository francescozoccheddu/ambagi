import { toObj } from '@francescozoccheddu/ts-goodies/arrays';
import { prDebug } from '@francescozoccheddu/ts-goodies/logs';
import { toArr } from '@francescozoccheddu/ts-goodies/objects';
import { dirs } from 'ambagi/utils/dirs';
import fs from 'fs';
import { nanoid } from 'nanoid';
import path from 'path';

export function randomStaticName(suffix: Str = ''): Str {
  return `/${dirs.distStaticBaseName}/${nanoid()}${suffix}`;
}

export function emitData(data: Str | Buffer, name: Str = randomStaticName()): Str {
  fs.writeFileSync(path.join(dirs.dist, name), data);
  return name;
}

export function emitFile(file: Str, name: Str = randomStaticName()): Str {
  fs.copyFileSync(file, path.join(dirs.dist, name));
  return name;
}

export function cleanDist(): void {
  fs.rmSync(dirs.dist, { force: true, recursive: true, maxRetries: 20, retryDelay: 100 });
  fs.mkdirSync(dirs.dist);
  fs.mkdirSync(dirs.distStatic);
}

export function emitCopy(): void {
  if (fs.existsSync(dirs.copy)) {
    fs.cpSync(dirs.copy, dirs.dist, { recursive: true, force: true });
  }
}

export function mimeToExt(mimeType: Str): Str | Nul {
  return {
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/ico': 'ico',
    'image/png': 'png',
    'image/svg+xml': 'svg',
    'font/woff': 'woff',
    'font/woff2': 'woff2',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'text/css': 'css',
    'text/javascript': 'js',
  }[mimeType.toLowerCase().split(';')[0]!] ?? null;
}

export function mimeToSuffix(mimeType: Str): Str {
  const ext = mimeToExt(mimeType);
  return ext ? `.${ext}` : '';
}

export async function mapValuesAsync<TV>(obj: RStrObj<Str>, map: (file: Str) => Promise<TV>): Promise<RStrObj<TV>> {
  return toObj(await Promise.all(toArr(obj).map(async ([k, v]) => [k, await (map(v))])));
}

export type TextLocal = (font: Str, text: Str) => Str;

export type FontUsageCollector = R<{
  textLocal: TextLocal;
  usage: RStrObj<Str>;
}>

export function makeFontUsageCollector(fonts: RArr<Str>): FontUsageCollector {
  const usage = toObj(fonts.map(font => [font, ''] as const));
  return {
    usage,
    textLocal: (font: Str, text: Str): Str => {
      usage[font] += text;
      return text;
    },
  };
}

let logOpLevel: Num = 0;

export function log(msg: Str): void {
  const prefix = '  '.repeat(logOpLevel);
  prDebug(prefix + msg.replaceAll('\n', '\n' + prefix));
}

export function pushLog(msg?: Str): void {
  if (msg) log(msg);
  logOpLevel++;
}

export function popLog(msg?: Str): void {
  logOpLevel--;
  if (msg) log(msg);
}