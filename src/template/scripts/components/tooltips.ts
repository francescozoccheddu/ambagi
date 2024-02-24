import { arrow, autoUpdate, computePosition, flip, hide as hideMw, limitShift, offset, shift } from '@floating-ui/dom';
import { setupVideoLoading } from 'ambagi/components/videos';

export function setupTooltips(root: HTMLElement): void {
  const links = Array.from(root.getElementsByClassName('footnote-link')) as HTMLElement[] as readonly HTMLElement[];
  const footnotes = Array.from(root.getElementsByClassName('footnotes')[0]?.children ?? []) as HTMLElement[] as readonly HTMLElement[];
  for (const [i, link] of links.entries()) {
    const footnote = footnotes[i]!;
    const body = footnote.getElementsByClassName('footnote-body').item(0)! as HTMLElement;
    const content = body.children[0]! as HTMLElement;
    setupTooltip(link, content, root);
  }
}

const showDelayMs = 500;
const hideDelayMs = 200;
const doubleClickMaxDelayMs = 200;
const clickAfterShowMinDelayMs = 500;

type TooltipInstance = Readonly<{
  tooltip: HTMLElement;
  arrow: HTMLElement;
  cancelAutoUpdate(): void;
}>

function canAutoPlayVideos(): boolean {
  return navigator?.userActivation?.hasBeenActive ?? true;
}

function setupTooltipContent(content: HTMLElement, hide: () => void): void {
  const video = content.getElementsByTagName('video')[0] ?? null;
  if (video) {
    setupVideoLoading(video);
    Object.assign(video.style, {
      width: `${video.width}px`,
      'aspect-ratio': `${video.width} / ${video.height}`,
    });
    if (!video.autoplay && (video.muted || canAutoPlayVideos())) {
      video.autoplay = true;
      video.controls = false;
      video.playsInline = true;
    }
    video.loop = false;
    if (canAutoPlayVideos()) {
      void video.play().catch(() => {
        video.controls = true;
      });
    }
    video.addEventListener('timeupdate', () => {
      if (video.currentTime > video.duration - 0.3 && !video.controls && !video.loop) {
        hide();
      }
    });
    video.addEventListener('click', () => {
      if (video.paused && (video.loop || video.currentTime < video.duration - 0.3) && !video.controls) {
        void video.play();
      }
    });
  }
}

function setupTooltip(link: HTMLElement, content: HTMLElement, root: HTMLElement): void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastClickTime: number = 0;
  let finished: boolean = false;
  let lastFirstOpenTime: number = 0;
  let elements: TooltipInstance | null = null;
  function getOpacity(): number {
    return (elements?.tooltip.computedStyleMap().get('opacity') as CSSUnitValue | undefined)?.value ?? 0;
  }
  function updatePosition(): void {
    if (elements) {
      void computePosition(link, elements.tooltip, {
        placement: 'top',
        middleware: [
          flip({
            padding: 20,
          }),
          shift({
            padding: 20,
            limiter: limitShift({
              offset: 20,
            }),
          }),
          offset(10),
          arrow({ element: elements.arrow }),
          hideMw({
            strategy: 'escaped',
          }),
        ],
      }).then(v => {
        if (elements) {
          Object.assign(elements.tooltip.style, {
            left: `${v.x}px`,
            top: `${v.y}px`,
          });
          const simplePlacement = v.placement.split('-')[0] as 'top' | 'right' | 'left' | 'bottom';
          elements.tooltip.dataset['placement'] = simplePlacement;
          const arrowData = v.middlewareData.arrow!;
          Object.assign(elements.arrow.style, {
            left: arrowData.x != null ? `${arrowData.x}px` : '',
            top: arrowData.y != null ? `${arrowData.y}px` : '',
            right: '',
            bottom: '',
          });
          if (v.middlewareData.hide!.escaped) {
            hide();
          }
        }
      });
    }
  }
  function clearTimer(): void {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }
  function setTimer(callback: () => void, delay: number): void {
    clearTimer();
    timer = setTimeout(callback, delay);
  }
  function hide(): void {
    clearTimer();
    elements?.tooltip.classList.remove('show', 'hovered');
  }
  function show(): void {
    clearTimer();
    if (elements === null) {
      finished = false;
      lastFirstOpenTime = performance.now();
      const ttEl = document.createElement('div');
      ttEl.className = 'tooltip';
      ttEl.addEventListener('transitionend', e => {
        if (elements && e.propertyName === 'opacity' && !ttEl.classList.contains('show') && getOpacity() < 0.25) {
          elements.cancelAutoUpdate();
          elements.tooltip.remove();
          elements = null;
        }
      });
      const ttContentEl = document.createElement('div');
      ttContentEl.className = 'tooltip-content';
      ttContentEl.addEventListener('mouseenter', () => {
        elements?.tooltip.classList.add('hovered');
        if (elements && getOpacity() > 0.25) {
          show();
        }
      });
      ttContentEl.addEventListener('mouseleave', () => {
        elements?.tooltip.classList.remove('hovered');
        setTimer(hide, hideDelayMs);
      });
      const ttArrowEl = document.createElement('div');
      ttArrowEl.className = 'tooltip-arrow';
      const contentEl = content.cloneNode(true) as HTMLElement;
      ttContentEl.append(contentEl);
      ttContentEl.append(ttArrowEl);
      ttEl.append(ttContentEl);
      elements = {
        arrow: ttArrowEl,
        tooltip: ttEl,
        cancelAutoUpdate: autoUpdate(link, ttEl, updatePosition),
      };
      root.append(ttEl);
      setupTooltipContent(contentEl, () => {
        finished = true;
        hide();
      });
    }
    if (!finished) {
      elements.tooltip.classList.add('show', 'hovered');
    }
  }
  link.addEventListener('mouseenter', () => {
    elements?.tooltip.classList.add('hovered');
    if (elements && getOpacity()) {
      show();
    }
    else {
      setTimer(show, showDelayMs);
    }
  });
  link.addEventListener('mouseleave', () => {
    elements?.tooltip.classList.remove('hovered');
    setTimer(hide, hideDelayMs);
  });
  link.addEventListener('click', e => {
    const now = performance.now();
    const isDoubleClick = now - lastClickTime < doubleClickMaxDelayMs;
    lastClickTime = now;
    if (!isDoubleClick && (getOpacity() < 0.9 || (now - lastFirstOpenTime < clickAfterShowMinDelayMs))) {
      e.preventDefault();
      show();
      return true;
    }
    hide();
    return false;
  });
}