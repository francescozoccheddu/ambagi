import { mapValues } from '@francescozoccheddu/ts-goodies/objects';
import babelPlugin from '@rollup/plugin-babel';
import commonJsPlugin from '@rollup/plugin-commonjs';
import eslintPlugin from '@rollup/plugin-eslint';
import nodeResolvePlugin from '@rollup/plugin-node-resolve';
import replacePlugin from '@rollup/plugin-replace';
import stripPlugin from '@rollup/plugin-strip';
import terserPlugin from '@rollup/plugin-terser';
import typescriptPlugin from '@rollup/plugin-typescript';
import path from 'path';
import { OutputChunk, OutputOptions, rollup, RollupBuild, RollupOptions } from 'rollup';
import inMemoryPlugin from 'rollup-plugin-memory-fs';
import { dirs } from 'utils/dirs';

export type ScriptUrlMapperFrom = R<{
  url: Str;
  scriptFile: Str | Nul;
}>

export async function buildScript(sourceFile: Str, replacements: RStrObj<RJson> = {}, dev: Bool = false): Promise<Str> {
  const typescriptConfigFile = path.join(dirs.scripts, 'tsconfig.json');
  const inputOptions: RollupOptions = {
    context: dirs.scripts,
    input: sourceFile,
    output: {
      dir: dirs.dist,
      format: 'iife',
      sourcemap: dev ? 'inline' : false,
    },
    plugins: [
      inMemoryPlugin(),
      eslintPlugin({
        throwOnError: true,
      }),
      replacePlugin({
        values: mapValues(replacements, v => JSON.stringify(v)),
        preventAssignment: true,
      }),
      commonJsPlugin(),
      nodeResolvePlugin(),
      typescriptPlugin({
        tsconfig: typescriptConfigFile,
        sourceMap: dev,
        inlineSourceMap: dev,
      }),
      ...(dev ? [] : [
        stripPlugin(),
        babelPlugin({
          extensions: ['.ts', '.js', '.json'],
          babelHelpers: 'bundled',
        }),
        terserPlugin(),
      ]),
    ],
  };
  let bundle: RollupBuild | Nul = null;
  try {
    bundle = await rollup(inputOptions);
    const { output } = await bundle.generate(inputOptions.output as OutputOptions);
    return output
      .filter(o => o.type === 'chunk')
      .map(o => (o as OutputChunk).code)
      .join('\n;\n');
  } finally {
    await bundle?.close();
  }
}
