import { dirs } from 'ambagi/utils/dirs';
import { dev } from 'ambagi/utils/env';
import autoprefixerPlugin from 'autoprefixer';
import cssnanoPlugin from 'cssnano';
import cssnanoPreset from 'cssnano-preset-advanced';
import path from 'path';
import postcss from 'postcss';
import importPlugin from 'postcss-import';
import urlPlugin from 'postcss-url';
import sass from 'sass';

export type StyleUrlMapperFrom = R<{
  url: Str;
  styleFile: Str | Nul;
}>

export type StyleUrlMapper = (from: StyleUrlMapperFrom) => Str | Promise<Str>

export async function buildStyle(sourceFile: Str, urlMapper: StyleUrlMapper | Nul = null): Promise<Str> {
  const loadPaths = [path.dirname(sourceFile), path.join(dirs.root, 'node_modules')];
  const sassResult = sass.compile(
    sourceFile,
    {
      sourceMap: dev,
      style: 'compressed',
      loadPaths,
    },
  );
  const postcssResult = await postcss([
    importPlugin({
      path: loadPaths,
    }),
    ...(urlMapper ? [
      urlPlugin({
        url(asset, styleFile): Str | Promise<Str> {
          return urlMapper({
            url: asset.url,
            styleFile: styleFile?.file ?? null,
          });
        },
      })] : []),
    ...(dev ? [] : [
      autoprefixerPlugin,
      cssnanoPlugin({
        preset: cssnanoPreset({
          autoprefixer: false,
        }),
      }),
    ]),
  ])
    .process(sassResult.css, {
      from: undefined,
      map: dev && {
        inline: true,
        prev: JSON.stringify(sassResult.sourceMap),
      },
    });
  postcssResult.warnings().forEach(w => console.warn(w.toString()));
  return postcssResult.css;
}
