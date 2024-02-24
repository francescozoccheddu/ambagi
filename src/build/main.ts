import '@francescozoccheddu/ts-goodies/globals/essentials';

import { err } from '@francescozoccheddu/ts-goodies/errors';
import { prExc } from '@francescozoccheddu/ts-goodies/logs';
import { buildSite } from 'ambagi/pipeline/buildSite';
import { devSite } from 'ambagi/pipeline/dev';

async function main(): Promise<void> {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 1) {
      err(`Expected 1 argument, got ${args.length}`);
    }
    const arg = args[0]!;
    switch (arg) {
      case 'build':
        await buildSite();
        break;
      case 'dev':
        await devSite();
        break;
      default:
        err('Unexpected argument', { allowed: ['build', 'dev'], got: arg });
    }
  } catch (e) {
    prExc(e, 'Error occurred');
    process.exit(1);
  }
}

void main();