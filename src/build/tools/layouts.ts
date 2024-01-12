import { getClientScript } from '@francescozoccheddu/reload-please';
import { dev } from 'ambagi/utils/env';
import { minify } from 'html-minifier-terser';
import pug from 'pug';

export type LayoutBuilder<TLocals extends StrObj> = (locals: TLocals) => Promise<Str>;

export function makeLayoutBuilder<TLocals extends StrObj>(templateFile: Str): LayoutBuilder<TLocals> {
  const template = pug.compileFile(templateFile);
  const devScript = dev ? getClientScript() : null;
  return async (locs: TLocals) => await minify(template({ ...locs, devScript }), {
    collapseBooleanAttributes: true,
    collapseWhitespace: true,
    decodeEntities: true,
    html5: true,
    minifyCSS: true,
    minifyJS: true,
    minifyURLs: true,
    removeComments: true,
    removeAttributeQuotes: true,
  });
}