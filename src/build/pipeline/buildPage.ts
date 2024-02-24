import { BuildResourcesResult } from 'ambagi/pipeline/buildResources';
import { PageConf, SiteConf } from 'ambagi/pipeline/conf';
import { log, TextLocal } from 'ambagi/pipeline/utils';
import { LayoutBuilder, makeLayoutBuilder } from 'ambagi/tools/layouts';
import { dirs } from 'ambagi/utils/dirs';
import { dev } from 'ambagi/utils/env';
import path from 'path';

type LayoutLocals = R<{
  res: BuildResourcesResult;
  text: TextLocal;
  siteConf: SiteConf;
  pageConf: { [key in keyof PageConf]: PageConf[key] | Und };
  pages: RArr<PageConfAndBody>;
  csp: Str;
}>

let layoutBuilder: LayoutBuilder<LayoutLocals> | Nul = null;

export type PageConfAndBodyUrl = R<{
  conf: PageConf;
  bodyUrl: Str;
}>

export type PageConfAndBody = PageConfAndBodyUrl & R<{
  bodyHtml: Str | Nul;
}>

export type BuildPageConf = R<{
  siteConf: SiteConf;
  resources: BuildResourcesResult;
  pages: RArr<PageConfAndBodyUrl>;
  expandedPage: PageConfAndBody | Nul;
  textLocal: TextLocal;
  csp: Str;
}>

export type BuildPageResult = R<{
  html: Str;
}>

export async function buildPage(buildConf: BuildPageConf): Promise<BuildPageResult> {
  log('Load conf');
  if (dev) {
    layoutBuilder = null;
  }
  layoutBuilder ??= makeLayoutBuilder<LayoutLocals>(path.join(dirs.layouts, 'page.pug'));
  log('Build layout');
  const pageConf = buildConf.expandedPage?.conf ?? null;
  const html = await layoutBuilder({
    res: buildConf.resources,
    text: buildConf.textLocal,
    siteConf: buildConf.siteConf,
    pageConf: pageConf ?? {
      title: undefined,
      url: undefined,
      allowRobots: undefined,
      date: undefined,
      description: undefined,
      keywords: undefined,
      priority: undefined,
      subtitle: undefined,
    },
    pages: buildConf.pages.map(c => c.conf.url === pageConf?.url
      ? buildConf.expandedPage!
      : {
        ...c,
        bodyHtml: null,
      }),
    csp: buildConf.csp,
  });
  log('Done');
  return {
    html,
  };
}