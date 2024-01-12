import { minify } from 'html-minifier-terser';
import pug from 'pug';

export type LayoutBuilder<TLocals extends StrObj> = (locals: TLocals) => Promise<Str>;

export function makeLayoutBuilder<TLocals extends StrObj>(templateFile: Str): LayoutBuilder<TLocals> {
  const template = pug.compileFile(templateFile);
  return async (locs: TLocals) => await minify(template(locs), {
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