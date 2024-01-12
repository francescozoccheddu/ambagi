import fs from 'fs';
import { optimize as svgo } from 'svgo';

export function buildIcon(iconFile: Str): Str {
  const source = fs.readFileSync(iconFile, 'utf8');
  return svgo(source, {
    plugins: [{
      name: 'preset-default',
      params: {
        overrides: {
        },
      },
    }],
  }).data;
}