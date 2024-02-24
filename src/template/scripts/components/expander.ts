export class Expander {

  private expanded: boolean;
  private progress: number;
  private lastRequestTime: number | null;
  readonly element: HTMLElement;
  duration: number;

  constructor(element: HTMLElement, startExpanded: boolean = true) {
    this.element = element;
    this.expanded = startExpanded;
    this.progress = startExpanded ? 1 : 0;
    this.lastRequestTime = null;
    this.duration = 1;
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
    const height = this.element.scrollHeight;
    const targetProgress = this.expanded ? 1 : 0;
    if (targetProgress > this.progress) {
      this.progress = Math.min(targetProgress, this.progress + elapsed / this.duration);
    }
    else {
      this.progress = Math.max(targetProgress, this.progress - elapsed / this.duration);
    }
    this.element.style.maxHeight = this.progress === 1 ? 'none' : `${(height * this.progress)}px`;
    if (this.progress !== targetProgress && this.lastRequestTime === null) {
      this.lastRequestTime = now;
      requestAnimationFrame(() => {
        this.update();
      });
    }
  }

}