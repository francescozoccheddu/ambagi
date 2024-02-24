import { Expander } from 'ambagi/components/expander';

type PageElements = Readonly<{
  root: HTMLElement;
  rootExpander: Expander;
  link: HTMLAnchorElement;
  bodyHolder: HTMLDivElement;
  bodyHolderExpander: Expander;
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

const rootUrl = '/';

function getUrl(): string {
  const segments = window.location.pathname.split('/');
  return segments[segments.length - 1] ?? rootUrl;
}

function scrollToElement(element: HTMLElement): void {
  const { top, bottom } = element.getBoundingClientRect();
  const { innerHeight } = window;
  if (bottom < 0 || top > innerHeight) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

async function retrieve(page: Page): Promise<boolean> {
  if (getUrl() === page.conf.url) {
    if (page.elements.bodyHolder.children.length > 0) {
      return true;
    }
    const res = await fetch(page.conf.bodyUrl);
    const html = await res.text();
    if (getUrl() === page.conf.url) {
      page.elements.bodyHolder.innerHTML = html;
      return true;
    }
  }
  return false;
}

export function setupNavigation(): void {
  const pagesEl = document.getElementById('pages')!;
  const logoEl = document.getElementById('logo')!;
  const pageEls: readonly PageElements[] = Array.from(pagesEl.getElementsByClassName('page')).map(el => {
    const bodyHolder = el.getElementsByClassName('body-holder')[0]! as HTMLDivElement;
    const root = el as HTMLElement;
    const link = el.getElementsByClassName('link')[0]! as HTMLAnchorElement;
    const hasSomeExpanded = pagesEl.classList.contains('expanded');
    const expanded = root.classList.contains('expanded');
    const rootExpander = new Expander(root, !hasSomeExpanded || expanded);
    rootExpander.speed = 10;
    const bodyHolderExpander = new Expander(bodyHolder, expanded);
    bodyHolderExpander.speed = 10;
    bodyHolderExpander.onHidden = (): void => {
      bodyHolder.innerHTML = '';
    };
    return {
      root,
      rootExpander,
      link,
      bodyHolder,
      bodyHolderExpander,
    };
  });
  const siteConf = extractSiteConf(pagesEl);
  const pages: readonly Page[] = pageEls.map(p => ({ conf: extractPageConf(p.root), elements: p }));

  function reset(): void {
    pagesEl.classList.remove('expanded');
    pageEls.forEach(p => {
      p.bodyHolderExpander.isExpanded = false;
      p.root.classList.remove('expanded');
      p.rootExpander.isExpanded = true;
    });
    setMeta(siteConf, null);
  }

  function goTo(url: string): void {
    const page = url === rootUrl ? null : pages.find(p => p.conf.url === url)!;
    if (!page?.elements.root.classList.contains('expanded')) {
      reset();
      if (page) {
        void retrieve(page).then(done => {
          if (done) {
            pageEls.forEach(p => {
              p.rootExpander.isExpanded = false;
            });
            pagesEl.classList.add('expanded');
            page.elements.root.classList.add('expanded');
            page.elements.rootExpander.isExpanded = true;
            page.elements.bodyHolderExpander.isExpanded = true;
            setMeta(siteConf, page.conf);
            scrollToElement(logoEl);
          }
        });
      }
    }
  }

  function pushState(url: string): void {
    window.history.pushState({}, '', url);
  }

  window.addEventListener('popstate', () => {
    goTo(getUrl());
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