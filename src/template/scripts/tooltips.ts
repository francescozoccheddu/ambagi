import { arrow, autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';

export function setupTooltips(): void {
  const links = Array.from(document.getElementsByClassName('footnote-link')) as HTMLElement[] as readonly HTMLElement[];
  const footnotes = Array.from(document.getElementById('footnotes')!.children) as HTMLElement[] as readonly HTMLElement[];
  for (const [i, link] of links.entries()) {
    const footnote = footnotes[i]!;
    const body = footnote.getElementsByClassName('footnote-body').item(0)! as HTMLElement;
    const content = body.children[0]! as HTMLElement;
    setupTooltip(link, content);
  }
}

const showDelayMs = 500;
const hideDelayMs = 200;

type TooltipInstance = Readonly<{
  tooltip: HTMLElement;
  arrow: HTMLElement;
  video: HTMLVideoElement | null;
  cancelAutoUpdate(): void;
}>

function setupTooltip(link: HTMLElement, content: HTMLElement): void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let shown = false;
  let elements: TooltipInstance | null = null;
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
          }),
          offset(10),
          arrow({ element: elements.arrow }),
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
  function hide(): void {
    if (!shown) {
      return;
    }
    shown = false;
    elements?.tooltip.remove();
    elements?.cancelAutoUpdate();
    elements = null;
  }
  function show(): void {
    if (shown) {
      return;
    }
    shown = true;
    const tooltipEl = document.createElement('div');
    tooltipEl.className = 'tooltip';
    tooltipEl.addEventListener('mouseenter', () => {
      clearTimer();
      show();
    });
    tooltipEl.addEventListener('mouseleave', () => {
      clearTimer();
      if (shown) {
        timer = setTimeout(hide, hideDelayMs);
      }
    });
    const arrowEl = document.createElement('div');
    arrowEl.className = 'arrow';
    const contentEl = content.cloneNode(true);
    tooltipEl.append(contentEl);
    tooltipEl.append(arrowEl);
    elements = {
      arrow: arrowEl,
      tooltip: tooltipEl,
      video: null,
      cancelAutoUpdate: autoUpdate(link, tooltipEl, updatePosition),
    };
    document.body.append(tooltipEl);
  }
  link.addEventListener('mouseenter', () => {
    clearTimer();
    if (!shown) {
      timer = setTimeout(show, showDelayMs);
    }
  });
  link.addEventListener('mouseleave', () => {
    clearTimer();
    if (shown) {
      timer = setTimeout(hide, hideDelayMs);
    }
  });
}