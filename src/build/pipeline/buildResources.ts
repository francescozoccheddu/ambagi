import { mapValues } from '@francescozoccheddu/ts-goodies/objects';
import { isStr } from '@francescozoccheddu/ts-goodies/types';
import { SiteConf } from 'ambagi/pipeline/conf';
import { emitData, log, mapValuesAsync, mimeToSuffix, randomStaticName } from 'ambagi/pipeline/utils';
import { buildFavicon } from 'ambagi/tools/favicon';
import { buildIcon } from 'ambagi/tools/icons';
import { buildScript } from 'ambagi/tools/scripts';
import { buildStyle } from 'ambagi/tools/style';
import { dirs } from 'ambagi/utils/dirs';
import path from 'path';

export class PageResource {

  private readonly _data: Str | Buffer;
  readonly mimeType: Str;
  private _inlineData: Str | Nul;
  private _url: Str | Nul;

  constructor(data: Str | Buffer, mimeType: Str) {
    this._data = data;
    this.mimeType = mimeType;
    this._inlineData = null;
    this._url = null;
  }

  get url(): Str {
    const suffix = mimeToSuffix(this.mimeType);
    return this._url ??= emitData(this._data, randomStaticName(suffix));
  }

  get inline(): Str {
    return this._inlineData
      ??= isStr(this._data)
        ? this._data
        : `data:${this.mimeType};base64,${this._data.toString('base64')}`;
  }

}

export type BuildResourcesConf = R<{
  siteConf: SiteConf;
}>

export type FontResource = R<{
  woffUrl: Str;
  woff2Url: Str;
}>

export type BuildResourcesResult = R<{
  icons: RStrObj<PageResource>;
  scripts: RStrObj<PageResource>;
  styles: RStrObj<PageResource>;
  fonts: RStrObj<FontResource>;
  faviconHtml: Str;
}>

export async function buildResources(buildConf: BuildResourcesConf): Promise<BuildResourcesResult> {
  const { siteConf } = buildConf;
  log('Build favicon');
  const favicon = await buildFavicon(path.join(dirs.favicon, siteConf.resources.favicon), siteConf);
  for (const file of favicon.files) {
    emitData(file.data, file.path);
  }
  const faviconHtml = favicon.htmlHeadElements.join('\n');
  const fonts: RStrObj<FontResource> = mapValues(siteConf.resources.fonts, () => ({
    woff2Url: randomStaticName('.woff2'),
    woffUrl: randomStaticName('.woff'),
  }));
  log('Build icons');
  const icons: RStrObj<PageResource> = mapValues(siteConf.resources.icons, f => new PageResource(buildIcon(path.join(dirs.icons, f)), 'image/svg+xml'));
  log('Build scripts');
  const scripts: RStrObj<PageResource> = await mapValuesAsync(siteConf.resources.scripts, async f => new PageResource(await buildScript(path.join(dirs.scripts, f)), 'text/javascript'));
  log('Build styles');
  const styles: RStrObj<PageResource> = await mapValuesAsync(siteConf.resources.styles, async f => new PageResource(await buildStyle(path.join(dirs.styles, f)), 'text/css'));
  return { fonts, icons, scripts, styles, faviconHtml };
}