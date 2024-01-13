import { arrow, autoUpdate, computePosition, flip, limitShift, offset, shift } from '@floating-ui/dom';

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
            limiter: limitShift({
              offset: 20,
            }),
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
      const ttEl = document.createElement('div');
      ttEl.className = 'tooltip';
      ttEl.addEventListener('transitionend', e => {
        if (elements && e.propertyName === 'opacity'
          && !ttEl.classList.contains('show')
          && (ttEl.computedStyleMap().get('opacity') as CSSUnitValue).value < 0.25) {
          elements.cancelAutoUpdate();
          elements.tooltip.remove();
          elements = null;
        }
      });
      const ttContentEl = document.createElement('div');
      ttContentEl.className = 'tooltip-content';
      ttContentEl.addEventListener('mouseenter', () => {
        elements?.tooltip.classList.add('hovered');
        if (elements && (ttEl.computedStyleMap().get('opacity') as CSSUnitValue).value > 0.25) {
          show();
        }
      });
      ttContentEl.addEventListener('mouseleave', () => {
        elements?.tooltip.classList.remove('hovered');
        setTimer(hide, hideDelayMs);
      });
      const ttArrowEl = document.createElement('div');
      ttArrowEl.className = 'tooltip-arrow';
      const contentEl = content.cloneNode(true);
      ttContentEl.append(contentEl);
      ttContentEl.append(ttArrowEl);
      ttEl.append(ttContentEl);
      elements = {
        arrow: ttArrowEl,
        tooltip: ttEl,
        video: null,
        cancelAutoUpdate: autoUpdate(link, ttEl, updatePosition),
      };
      document.body.append(ttEl);
    }
    elements.tooltip.classList.add('show', 'hovered');
  }
  link.addEventListener('mouseenter', () => {
    elements?.tooltip.classList.add('hovered');
    if (elements && (elements.tooltip.computedStyleMap().get('opacity') as CSSUnitValue).value > 0.25) {
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
}