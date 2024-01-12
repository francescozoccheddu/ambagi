import '@francescozoccheddu/ts-goodies/globals/essentials';

import { prExc } from '@francescozoccheddu/ts-goodies/logs';
import { watch } from 'ambagi/pipeline/watch';

async function main(): Promise<void> {
  try {
    await watch();
  } catch (e) {
    prExc(e, 'Error occurred');
    process.exit(1);
  }
}

void main();