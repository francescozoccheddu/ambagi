type PageElements = Readonly<{
  root: HTMLElement;
  link: HTMLAnchorElement;
  bodyHolder: HTMLDivElement;
}>

export function setupNavigation(): void {
  const pagesEl = document.getElementById('pages')!;
  const logoEl = document.getElementById('logo')!;
  const pageEls: readonly PageElements[] = Array.from(pagesEl.getElementsByClassName('page')).map(el => ({
    root: el as HTMLElement,
    link: el.getElementsByClassName('link')[0]! as HTMLAnchorElement,
    bodyHolder: el.getElementsByClassName('body-holder')[0]! as HTMLDivElement,
  }));
  logoEl.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    pagesEl.classList.remove('expanded');
    pageEls.forEach(p => {
      p.bodyHolder.innerHTML = '';
      p.root.classList.remove('expanded');
    });
    return true;
  });
  pageEls.forEach(p => {
    const bodyUrl = p.root.dataset['bodyUrl']!;
    p.link.addEventListener('click', e => {
      console.log(p);
      e.preventDefault();
      e.stopPropagation();
      pagesEl.classList.add('expanded');
      pageEls.forEach(p => {
        p.bodyHolder.innerHTML = '';
        p.root.classList.remove('expanded');
      });
      p.root.classList.add('expanded');
      void fetch(bodyUrl).then(res => {
        void res.text().then(html => {
          p.bodyHolder.innerHTML = html;
        });
      });
      return true;
    });
  });
}