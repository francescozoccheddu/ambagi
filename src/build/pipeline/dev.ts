import { Server as ReloadServer } from '@francescozoccheddu/reload-please';
import { prDone, prExc } from '@francescozoccheddu/ts-goodies/logs';
import { buildSite } from 'ambagi/pipeline/site';
import { popLog, pushLog } from 'ambagi/pipeline/utils';
import { dirs } from 'ambagi/utils/dirs';
import { dev, setEnvironment } from 'ambagi/utils/env';
import { watch as chokidarWatch } from 'chokidar';
import fs from 'fs';
import Koa from 'koa';
import koaStatic from 'koa-static';

async function watch(): Promise<void> {
  const delay = 0.5;
  let timeoutId: NodeJS.Timeout | Nul = null;
  let updating = false;
  let needsUpdate = false;
  const reloadServer = new ReloadServer();
  reloadServer.start();
  async function update(): Promise<void> {
    if (updating) {
      needsUpdate = true;
      return;
    }
    updating = true;
    needsUpdate = false;
    const startTime = performance.now();
    pushLog('Rebuilding');
    try {
      await buildSite();
    } catch (e) {
      prExc(e, 'Error while rebuilding');
    }
    const endTime = performance.now();
    popLog(`Done (${((endTime - startTime) / 1000).toFixed(3)}s)`);
    fs.rmSync(dirs.distDev, { recursive: true, force: true });
    fs.cpSync(dirs.dist, dirs.distDev, { recursive: true, force: true, errorOnExist: false });
    reloadServer.reload();
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
  reloadServer.stop();
  await watcher.close();
}

export async function devSite(): Promise<void> {
  const wasDev = dev;
  setEnvironment(true);
  fs.rmSync(dirs.distDev, { recursive: true, force: true });
  fs.mkdirSync(dirs.distDev);
  const koa = new Koa();
  koa.use(koaStatic(dirs.dist));
  const port = 5500;
  const server = koa.listen(port);
  await new Promise(resolve => {
    server.addListener('listening', resolve);
  });
  prDone(`Listening at http://localhost:${port}/`);
  try {
    await watch();
  } finally {
    setEnvironment(wasDev);
  }
  server.close();
  server.closeAllConnections();
  fs.rmSync(dirs.distDev, { recursive: true, force: true });
}
