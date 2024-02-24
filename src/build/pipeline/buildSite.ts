import { toSet } from '@francescozoccheddu/ts-goodies/arrays';
import { err } from '@francescozoccheddu/ts-goodies/errors';
import { toArr } from '@francescozoccheddu/ts-goodies/objects';
import { buildPageBody } from 'ambagi/pipeline/buildBody';
import { buildPage } from 'ambagi/pipeline/buildPage';
import { buildResources } from 'ambagi/pipeline/buildResources';
import { PageConf, SiteConf } from 'ambagi/pipeline/conf';
import { cleanDist, emitCopy, emitData, log, makeFontUsageCollector, popLog, pushLog, randomStaticName } from 'ambagi/pipeline/utils';
import { buildCsp, cspValues } from 'ambagi/tools/csp';
import { makeYamlLoader, YamlLoader } from 'ambagi/tools/data';
import { buildFont } from 'ambagi/tools/fonts';
import { buildRobotsTxt, buildSitemapTxt, RobotsEntry } from 'ambagi/tools/robots';
import { dirs } from 'ambagi/utils/dirs';
import { dev } from 'ambagi/utils/env';
import { joinUrl } from 'ambagi/utils/urls';
import fs from 'fs';
import path from 'path';

let siteConfLoader: YamlLoader<SiteConf> | Nul = null;
let pageConfLoader: YamlLoader<PageConf> | Nul = null;

type Page = R<{
  dirname: Str;
  bodyHtml: Str;
  bodyUrl: Str;
  conf: PageConf;
}>

export async function buildSite(): Promise<void> {
  log('Clean');
  cleanDist();
  log('Load config');
  siteConfLoader ??= makeYamlLoader<SiteConf>(path.join(dirs.schemas, 'site.json'));
  pageConfLoader ??= makeYamlLoader<PageConf>(path.join(dirs.schemas, 'page.json'));
  const siteConf = siteConfLoader(path.join(dirs.template, 'site.yml'));
  pushLog('Load resources');
  const resources = await buildResources({ siteConf });
  popLog();
  const pageDirents = fs.readdirSync(dirs.pages, { withFileTypes: true }).filter(dirent => dirent.isDirectory());
  const fontUsageCollector = makeFontUsageCollector(Object.keys(siteConf.resources.fonts));
  const pages: Arr<Page> = [];
  for (const pageDirent of pageDirents) {
    const dirname = pageDirent.name;
    pushLog(`Build body of page '${dirname}'`);
    log('Load config');
    const dir = path.join(pageDirent.path, dirname);
    const result = await buildPageBody({ dir, siteConf, resources, textLocal: fontUsageCollector.textLocal });
    const conf = pageConfLoader(path.join(dir, 'page.yml'));
    const bodyUrl = emitData(result.html, randomStaticName('.html'));
    pages.push({
      bodyHtml: result.html,
      bodyUrl,
      conf,
      dirname,
    });
    popLog();
  }
  if (toSet(pages.map(p => p.conf.url)).size < pages.length) {
    err('Duplicate page url');
  }
  const csp = buildCsp(
    [
      { target: 'default-src', values: [cspValues.none] },
      { target: 'script-src', values: [cspValues.self, cspValues.unsafeInline] },
      { target: 'style-src', values: [cspValues.self, cspValues.unsafeInline] },
      { target: 'font-src', values: [cspValues.self] },
      { target: 'img-src', values: [cspValues.self] },
      { target: 'media-src', values: [cspValues.self] },
      { target: 'connect-src', values: [cspValues.self] },
      ...(dev ? [{ target: 'connect-src', values: [cspValues.all] }] : []),
    ]);
  for (const page of pages) {
    pushLog(`Build page '${page.dirname}'`);
    const result = await buildPage({
      resources,
      siteConf,
      pages,
      expandedPage: page,
      textLocal: fontUsageCollector.textLocal,
      csp,
    });
    emitData(result.html, `${page.conf.url}.html`);
    popLog();
  }
  pushLog('Build index page');
  const indexResult = await buildPage({
    resources,
    siteConf,
    pages,
    expandedPage: null,
    textLocal: fontUsageCollector.textLocal,
    csp,
  });
  emitData(indexResult.html, 'index.html');
  popLog();
  log('Build fonts');
  for (const [key, text] of toArr(fontUsageCollector.usage)) {
    const data = fs.readFileSync(path.join(dirs.fonts, siteConf.resources.fonts[key]!));
    const urls = resources.fonts[key]!;
    const fonts = await buildFont(data, text);
    emitData(fonts.woff, urls.woffUrl);
    emitData(fonts.woff2, urls.woff2Url);
  }
  log('Build metadata');
  const robotsEntries: RArr<RobotsEntry> = pages
    .flatMap(p => [p.conf.url, `${p.conf.url}.html`].map(url => ({ path: url, allow: (p.conf.allowRobots ?? false) && (siteConf.allowRobots ?? false) })))
    .concat(['/', 'index', 'index.html'].map(url => ({ path: url, allow: siteConf.allowRobots ?? false })));
  emitData(buildRobotsTxt(joinUrl(siteConf.url, 'sitemap.txt'), robotsEntries), 'robots.txt');
  const pageUrls: RArr<Str> = pages
    .map(p => p.conf.url)
    .concat([''])
    .map(url => path.posix.join('/', url));
  emitData(buildSitemapTxt(pageUrls), 'sitemap.txt');
  emitCopy();
  log('Done');
}