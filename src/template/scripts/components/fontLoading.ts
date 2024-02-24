let loaded = false;
const listeners: Set<() => void> = new Set();

function onFontsReady(): void {
  if (!loaded) {
    loaded = true;
    listeners.forEach(l => l());
    listeners.clear();
  }
}

function setup(): void {
  setTimeout(onFontsReady, 3000);
  try {
    void document.fonts.ready.then(onFontsReady);
  } catch { /* empty */ }
  try {
    document.fonts.addEventListener('loadingdone', onFontsReady);
  } catch { /* empty */ }
}

export function addFontsReadyListener(listener: () => void): void {
  if (loaded) {
    listener();
  }
  else {
    listeners.add(listener);
  }
}

setup();
