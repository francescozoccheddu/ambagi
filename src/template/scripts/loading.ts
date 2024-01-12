let loaded = false;

export function setLoaded(): void {
  if (!loaded) {
    loaded = true;
    const $main = document.getElementById('main')!;
    $main.addEventListener('animationstart', () => {
      document.body.classList.remove('faded-in');
      document.body.classList.add('fading-in');
    });
    $main.addEventListener('animationend', () => {
      document.body.classList.add('faded-in');
      document.body.classList.remove('fading-in');
    });
    document.body.classList.add('loaded');
  }
}