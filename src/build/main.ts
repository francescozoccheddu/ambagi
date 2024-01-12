import '@francescozoccheddu/ts-goodies/globals/essentials';

import { prExc } from '@francescozoccheddu/ts-goodies/logs';
import { buildSite } from 'ambagi/pipeline/site';

async function main(): Promise<void> {
  try {
    await buildSite();
  } catch (e) {
    prExc(e, 'Error occurred');
    process.exit(1);
  }
}

void main();