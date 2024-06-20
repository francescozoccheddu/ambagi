let loaded = false;

export function setLoaded(): void {
  if (!loaded) {
    loaded = true;
    const main = document.getElementById('main')!;
    main.addEventListener('animationstart', e => {
      if (e.target == main) {
        document.body.classList.remove('faded-in');
        document.body.classList.add('fading-in');
      }
    });
    main.addEventListener('animationend', e => {
      if (e.target == main) {
        document.body.classList.add('faded-in');
        document.body.classList.remove('fading-in');
      }
    });
    document.body.classList.add('loaded');
  }
}