type PageElements = Readonly<{
  root: HTMLElement;
  link: HTMLAnchorElement;
  bodyHolder: HTMLDivElement;
}>

type SiteConf = Readonly<{
  title: string;
  description: string;
  keywords: readonly string[];
}>

type PageConf = Readonly<{
  title: string;
  description: string | null;
  keywords: readonly string[];
  url: string;
  bodyUrl: string;
}>

type Page = Readonly<{
  elements: PageElements;
  conf: PageConf;
}>

function extractSiteConf(element: HTMLElement): SiteConf {
  return {
    title: element.dataset['title']!,
    description: element.dataset['description']!,
    keywords: JSON.parse(element.dataset['keywords']!) as readonly string[],
  };
}

function extractPageConf(element: HTMLElement): PageConf {
  return {
    title: element.dataset['title']!,
    description: element.dataset['description']!,
    keywords: JSON.parse(element.dataset['keywords']!) as readonly string[],
    url: element.dataset['url']!,
    bodyUrl: element.dataset['bodyUrl']!,
  };
}

function setMeta(siteConf: SiteConf, pageConf: PageConf | null): void {
  const head = document.head;
  head.getElementsByTagName('title')[0]!.innerText = [siteConf.title, pageConf?.title].filter(t => t).join(' ');
  head.querySelector('meta[name="description"]')!.setAttribute('content', pageConf?.description ?? siteConf.description);
  head.querySelector('meta[name="keywords"]')!.setAttribute('content', [...(pageConf?.keywords || []), ...(siteConf.keywords || [])].join(', '));
}

const stateKey = '__ambagi_navigation_url__';
const rootUrl = '/';

function createState(url: string): object {
  return { [stateKey]: url };
}

function getStateUrl(state: unknown): string | null {
  return typeof state === 'object' && state && stateKey in state ? state[stateKey] as string : null;
}

export function setupNavigation(): void {
  const pagesEl = document.getElementById('pages')!;
  const logoEl = document.getElementById('logo')!;
  const pageEls: readonly PageElements[] = Array.from(pagesEl.getElementsByClassName('page')).map(el => ({
    root: el as HTMLElement,
    link: el.getElementsByClassName('link')[0]! as HTMLAnchorElement,
    bodyHolder: el.getElementsByClassName('body-holder')[0]! as HTMLDivElement,
  }));
  const siteConf = extractSiteConf(pagesEl);
  const pages: readonly Page[] = pageEls.map(p => ({ conf: extractPageConf(p.root), elements: p }));

  function reset(): void {
    pagesEl.classList.remove('expanded');
    pageEls.forEach(p => {
      p.bodyHolder.innerHTML = '';
      p.root.classList.remove('expanded');
    });
    setMeta(siteConf, null);
  }

  function goTo(url: string): void {
    reset();
    if (url !== rootUrl) {
      const page = pages.find(p => p.conf.url === url)!;
      void fetch(page.conf.bodyUrl).then(res => {
        void res.text().then(html => {
          console.log(window.history.state, getStateUrl(window.history.state));
          if (getStateUrl(window.history.state) === url) {
            pagesEl.classList.add('expanded');
            page.elements.root.classList.add('expanded');
            page.elements.bodyHolder.innerHTML = html;
            setMeta(siteConf, page.conf);
          }
        });
      });
    }
  }

  function pushState(url: string): void {
    window.history.pushState(createState(url), '', url);
  }

  window.addEventListener('popstate', e => {
    const url = getStateUrl(e.state) ?? rootUrl;
    goTo(url);
  });

  logoEl.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    pushState(rootUrl);
    goTo(rootUrl);
    return true;
  });

  pageEls.forEach(p => {
    p.link.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const pageConf = extractPageConf(p.root);
      pushState(pageConf.url);
      goTo(pageConf.url);
      return true;
    });
  });
}