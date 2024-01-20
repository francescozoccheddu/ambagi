import { toObj } from '@francescozoccheddu/ts-goodies/arrays';
import { mapValues, toArr } from '@francescozoccheddu/ts-goodies/objects';
import { SiteConf } from 'ambagi/pipeline/conf';
import { buildPage } from 'ambagi/pipeline/page';
import { BuildPageConf, cleanDist, emitCopy, emitData, log, PageResource, popLog, pushLog } from 'ambagi/pipeline/utils';
import { makeYamlLoader, YamlLoader } from 'ambagi/tools/data';
import { buildFavicon } from 'ambagi/tools/favicon';
import { buildIcon } from 'ambagi/tools/icons';
import { buildRobotsTxt, buildSitemapTxt, RobotsEntry } from 'ambagi/tools/robots';
import { buildScript } from 'ambagi/tools/scripts';
import { buildStyle } from 'ambagi/tools/style';
import { dirs } from 'ambagi/utils/dirs';
import { joinUrl } from 'ambagi/utils/urls';
import fs from 'fs';
import path from 'path';

async function mapValuesAsync<TV>(obj: RStrObj<Str>, map: (file: Str) => Promise<TV>): Promise<RStrObj<TV>> {
  return toObj(await Promise.all(toArr(obj).map(async ([k, v]) => [k, await (map(v))])));
}

let siteConfLoader: YamlLoader<SiteConf> | Nul = null;

export async function buildSite(): Promise<void> {
  log('Clean');
  cleanDist();
  log('Load config');
  siteConfLoader ??= makeYamlLoader<SiteConf>(path.join(dirs.schemas, 'site.json'));
  const siteConf = siteConfLoader(path.join(dirs.template, 'site.yml'));
  log('Build favicon');
  const favicon = await buildFavicon(path.join(dirs.favicon, siteConf.resources.favicon), siteConf);
  for (const file of favicon.files) {
    emitData(file.data, file.path);
  }
  log('Load fonts');
  const fonts: RStrObj<Buffer> = mapValues(siteConf.resources.fonts, f => fs.readFileSync(path.join(dirs.fonts, f)));
  log('Build icons');
  const icons: RStrObj<PageResource> = mapValues(siteConf.resources.icons, f => new PageResource(buildIcon(path.join(dirs.icons, f)), 'image/svg+xml'));
  log('Build scripts');
  const scripts: RStrObj<PageResource> = await mapValuesAsync(siteConf.resources.scripts, async f => new PageResource(await buildScript(path.join(dirs.scripts, f)), 'text/javascript'));
  log('Build styles');
  const styles: RStrObj<PageResource> = await mapValuesAsync(siteConf.resources.styles, async f => new PageResource(await buildStyle(path.join(dirs.styles, f)), 'text/css'));
  const buildPageConf: BuildPageConf = {
    siteConf,
    faviconHtml: favicon.htmlHeadElements.join('\n'),
    fonts,
    icons,
    scripts,
    styles,
  };
  const pageDirents = fs.readdirSync(dirs.pages, { withFileTypes: true }).filter(dirent => dirent.isDirectory());
  const robotsEntries: Arr<RobotsEntry> = [
    { path: '/', allow: siteConf.allowRobots ?? false },
    { path: `/${dirs.distStaticBaseName}`, allow: false },
  ];
  const pageUrls: Arr<Str> = [];
  for (const pageDirent of pageDirents) {
    pushLog(`Build page '${pageDirent.name}'`);
    const buildOut = await buildPage(path.join(pageDirent.path, pageDirent.name), buildPageConf);
    pageUrls.push(buildOut.url);
    robotsEntries.push({ path: buildOut.url, allow: buildOut.allowRobots });
    popLog();
  }
  log('Build metadata');
  emitData(buildRobotsTxt(joinUrl(siteConf.url, 'sitemap.txt'), robotsEntries), 'robots.txt');
  emitData(buildSitemapTxt(pageUrls), 'sitemap.txt');
  emitCopy();
  log('Done');
}