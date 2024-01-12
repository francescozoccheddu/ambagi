import { toObj } from '@francescozoccheddu/ts-goodies/arrays';
import { mapValues, toArr } from '@francescozoccheddu/ts-goodies/objects';
import { SiteConf } from 'ambagi/pipeline/conf';
import { buildPage } from 'ambagi/pipeline/page';
import { BuildPageConf, emitData, PageResource } from 'ambagi/pipeline/utils';
import { makeYamlLoader, YamlLoader } from 'ambagi/tools/data';
import { buildFavicon } from 'ambagi/tools/favicon';
import { buildIcon } from 'ambagi/tools/icons';
import { buildRobotsTxt, buildSitemapTxt, RobotsEntry } from 'ambagi/tools/robots';
import { buildRoutes, Route } from 'ambagi/tools/routes';
import { buildScript } from 'ambagi/tools/scripts';
import { buildStyle } from 'ambagi/tools/style';
import { dirs } from 'ambagi/utils/dirs';
import fs from 'fs';
import path from 'path';

async function mapValuesAsync<TV>(obj: RStrObj<Str>, map: (file: Str) => Promise<TV>): Promise<RStrObj<TV>> {
  return toObj(await Promise.all(toArr(obj).map(async ([k, v]) => [k, await (map(v))])));
}

let siteConfLoader: YamlLoader<SiteConf> | Nul = null;

export async function buildSite(): Promise<void> {
  fs.rmSync(dirs.dist, { recursive: true, force: true });
  fs.mkdirSync(dirs.dist);
  fs.mkdirSync(dirs.distStatic);
  siteConfLoader ??= makeYamlLoader<SiteConf>(path.join(dirs.schemas, 'site.json'));
  const siteConf = siteConfLoader(path.join(dirs.template, 'site.yml'));
  const favicon = await buildFavicon(path.join(dirs.favicon, siteConf.resources.favicon), siteConf);
  for (const file of favicon.files) {
    emitData(file.data, file.path);
  }
  const fonts: RStrObj<Buffer> = mapValues(siteConf.resources.fonts, f => fs.readFileSync(path.join(dirs.fonts, f)));
  const icons: RStrObj<PageResource> = mapValues(siteConf.resources.icons, f => new PageResource(buildIcon(path.join(dirs.icons, f)), 'image/svg+xml'));
  const scripts: RStrObj<PageResource> = await mapValuesAsync(siteConf.resources.scripts, async f => new PageResource(await buildScript(path.join(dirs.scripts, f)), 'text/javascript'));
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
  const routes: Arr<Route> = [];
  const pageUrls: Arr<Str> = [];
  for (const pageDirent of pageDirents) {
    const buildOut = await buildPage(path.join(pageDirent.path, pageDirent.name), buildPageConf);
    pageUrls.push(buildOut.publicUrl);
    robotsEntries.push({ path: buildOut.publicUrl, allow: buildOut.allowRobots });
    routes.push({ from: buildOut.publicUrl, to: buildOut.pageUrl });
  }
  emitData(buildRobotsTxt(siteConf.url, robotsEntries), 'robots.txt');
  emitData(buildSitemapTxt(siteConf.url, pageUrls), 'sitemap.txt');
  emitData(buildRoutes(routes), 'ROUTES');
}