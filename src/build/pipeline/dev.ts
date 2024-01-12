import { buildSite } from 'ambagi/pipeline/site';
import { popLog, pushLog } from 'ambagi/pipeline/utils';
import { dirs } from 'ambagi/utils/dirs';
import { watch as chokidarWatch } from 'chokidar';

const delay = 0.5;

export async function devSite(): Promise<void> {
  let timeoutId: NodeJS.Timeout | Nul = null;
  let updating = false;
  let needsUpdate = false;
  async function update(): Promise<void> {
    if (updating) {
      needsUpdate = true;
      return;
    }
    updating = true;
    needsUpdate = false;
    const startTime = performance.now();
    pushLog('Rebuilding');
    await buildSite();
    const endTime = performance.now();
    popLog(`Done (${((endTime - startTime) / 1000).toFixed(3)}s)`);
    if (needsUpdate && !timeoutId) {
      setTimeout(() => void update());
    }
    updating = false;
  }
  function onFileChange(): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      void update();
    }, delay * 1000);
  }
  const watcher = chokidarWatch([dirs.template, dirs.pages], {
    ignoreInitial: true,
  })
    .on('add', onFileChange)
    .on('change', onFileChange)
    .on('unlink', onFileChange);
  void update();
  await new Promise<void>(resolve => {
    process.on('SIGINT', resolve);
  });
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  await watcher.close();
}