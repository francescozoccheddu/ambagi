import { isStr } from '@francescozoccheddu/ts-goodies/types';
import { SiteConf } from 'ambagi/pipeline/conf';
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

export type BuildPageResult = R<{
  url: Str;
  allowRobots: Bool;
}>

export type BuildPageConf = R<{
  siteConf: SiteConf;
  icons: RStrObj<PageResource>;
  scripts: RStrObj<PageResource>;
  styles: RStrObj<PageResource>;
  fonts: RStrObj<Buffer>;
  faviconHtml: Str;
}>

export class PageResource {

  private readonly _data: Str | Buffer;
  readonly mimeType: Str;
  readonly suffix: Str;
  private _inlineData: Str | Nul;
  private _url: Str | Nul;

  constructor(data: Str | Buffer, mimeType: Str, suffix: Str = '') {
    this._data = data;
    this.mimeType = mimeType;
    this._inlineData = null;
    this._url = null;
    this.suffix = suffix;
  }

  get url(): Str {
    return this._url ??= emitData(this._data, randomStaticName(this.suffix));
  }

  get inline(): Str {
    return this._inlineData
      ??= isStr(this._data)
        ? this._data
        : `data:${this.mimeType};base64,${this._data.toString('base64')}`;
  }

}