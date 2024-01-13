import { err } from '@francescozoccheddu/ts-goodies/errors';
import findPackageJson from 'find-package-json';
import path from 'path';

const packageJsonFile: Str = findPackageJson().next().filename ?? err('Cannot find \'package.json\'');
const root = path.dirname(packageJsonFile);
const dist = path.join(root, 'dist');
const src = path.join(root, 'src');
const schemas = path.join(src, 'schemas');
const build = path.join(src, 'build');
const pages = path.join(root, 'ambagi-pages/pages');
const template = path.join(src, 'template');
const fonts = path.join(template, 'fonts');
const layouts = path.join(template, 'layouts');
const scripts = path.join(template, 'scripts');
const styles = path.join(template, 'styles');
const icons = path.join(template, 'icons');
const favicon = path.join(template, 'favicon');
const distStaticBaseName = 'static';
const distStatic = path.join(dist, distStaticBaseName);

export const dirs = {
  root, dist, src, schemas, build, pages, template, fonts, layouts, scripts, styles, icons, favicon, distStatic, distStaticBaseName,
} as const;
