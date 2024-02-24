export class Expander {

  private expanded: boolean;
  private progress: number;
  private lastRequestTime: number | null;
  readonly element: HTMLElement;
  speed: number;
  onHidden: null | (() => void);
  onShown: null | (() => void);

  constructor(element: HTMLElement, startExpanded: boolean = true) {
    this.element = element;
    this.expanded = startExpanded;
    this.progress = startExpanded ? 1 : 0;
    this.lastRequestTime = null;
    this.speed = 1;
    this.onHidden = null;
    this.onShown = null;
    this.update();
  }

  get isExpanded(): boolean {
    return this.expanded;
  }

  set isExpanded(expanded: boolean) {
    if (this.expanded !== expanded) {
      this.expanded = expanded;
      this.update();
    }
  }

  private update(): void {
    const now = performance.now();
    const elapsed = (now - (this.lastRequestTime ?? now)) / 1000;
    this.lastRequestTime = null;
    const height = Math.min(this.element.scrollHeight, window.innerHeight);
    const targetProgress = this.expanded ? 1 : 0;
    const diff = Math.max(Math.min(Math.abs(this.progress - targetProgress) * elapsed * this.speed, 0.75), 0.001);
    if (targetProgress > this.progress) {

      this.progress = Math.min(targetProgress, this.progress + diff);
    }
    else {
      this.progress = Math.max(targetProgress, this.progress - diff);
    }
    if (Math.abs(this.progress - targetProgress) < 0.000000000001) {
      this.progress = targetProgress;
    }
    if (this.progress === targetProgress) {
      if (this.expanded) {
        this.onShown?.();
      } else {
        this.onHidden?.();
      }
    }
    this.element.style.maxHeight = this.progress === 1 ? 'none' : `${(height * this.progress)}px`;
    if (!this.expanded)
      console.log(this.element.style.maxHeight);
    if (this.progress !== targetProgress && this.lastRequestTime === null) {
      this.lastRequestTime = now;
      requestAnimationFrame(() => {
        this.update();
      });
    }
  }

}