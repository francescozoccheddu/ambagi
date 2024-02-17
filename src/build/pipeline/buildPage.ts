import { isEmpty, isSingle, single } from '@francescozoccheddu/ts-goodies/arrays';
import { err } from '@francescozoccheddu/ts-goodies/errors';
import { BuildResourcesResult } from 'ambagi/pipeline/buildResources';
import { PageConf, SiteConf } from 'ambagi/pipeline/conf';
import { log, TextLocal } from 'ambagi/pipeline/utils';
import { LayoutBuilder, makeLayoutBuilder } from 'ambagi/tools/layouts';
import { dirs } from 'ambagi/utils/dirs';
import path from 'path';

type LayoutLocals = R<{
  res: BuildResourcesResult;
  text: TextLocal;
  siteConf: SiteConf;
  pageConf: PageConf | Nul;
  pages: RArr<PageConfAndBody>;
  csp: Str;
}>

let layoutBuilder: LayoutBuilder<LayoutLocals> | Nul = null;

export type PageConfAndBody = R<{
  conf: PageConf;
  bodyUrl: Str;
  bodyHtml: Str | Nul;
}>

export type BuildPageConf = R<{
  siteConf: SiteConf;
  resources: BuildResourcesResult;
  pages: RArr<PageConfAndBody>;
  textLocal: TextLocal;
  csp: Str;
}>

export type BuildPageResult = R<{
  html: Str;
}>

export async function buildPage(buildConf: BuildPageConf): Promise<BuildPageResult> {
  log('Load conf');
  layoutBuilder ??= makeLayoutBuilder<LayoutLocals>(path.join(dirs.layouts, 'page.pug'));
  log('Build layout');
  const pageConfs = buildConf.pages.filter(p => p.bodyHtml !== null).map(p => p.conf);
  const pageConf = isSingle(pageConfs)
    ? single(pageConfs)
    : isEmpty(pageConfs) ? null : err('Multiple pages have body', { pages: pageConfs.map(p => p.url) });
  const html = await layoutBuilder({
    res: buildConf.resources,
    text: buildConf.textLocal,
    siteConf: buildConf.siteConf,
    pageConf,
    pages: buildConf.pages,
    csp: buildConf.csp,
  });
  log('Done');
  return {
    html,
  };
}